const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const generateEmbedding = require('./utilities/generateEmbedding.js');
require('dotenv').config();
const nonVectorQuery = require('./api-utils/nonVectorQuery');
const vectorQuery = require('./api-utils/vectorQuery');

const { pool } = require('./db.js');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://handbooky-frontend-dev.herokuapp.com',
    'https://handbooky-frontend-575fce723934.herokuapp.com',
    'https://blazer-ai-abt.com'
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());


app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  // Skip auth for health checks
  if (req.path === '/health' || req.path === '/api/chat') {
    console.log('Skipping auth for:', req.path);
    return next();
  }

  console.log('running auth check for:', req.path);
  const auth = req.headers.authorization;

  const credentials = Buffer.from(
    `${process.env.DEV_USER || 'dev'}:${process.env.DEV_PASSWORD}`
  ).toString('base64');

  if (!auth || auth !== `Basic ${credentials}`) {
    res.set('WWW-Authenticate', 'Basic realm="Dev Environment"');
    return res.status(401).send('Access denied');
  }
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'claude-3-5-haiku' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const courseCodePattern = /\b([A-Z]{2,4}-\d{2,4})\b/g;
    const courseCodes = message.match(courseCodePattern);
    let searchResults;

    if (courseCodes) {
      searchResults = await pool.query(nonVectorQuery(courseCodes), [
        `%${courseCodes[0].toLowerCase()}%`,
      ]);

      console.log('Non vector search results');
    } else {
      const userEmbedding = await generateEmbedding(message);

      searchResults = await pool.query(vectorQuery(userEmbedding), [
        `[${userEmbedding.join(',')}]`,
      ]);

      console.log('Number of results:', searchResults.rows.length);
      console.log(
        'Course Codes:',
        searchResults.rows.map(r => r.course_code)
      );
      console.log(
        'Text returned:',
        searchResults.rows.map(r => r.text.substring(0, 100))
      );

      console.log(
        'Similarity scores:',
        searchResults.rows.map(r => r.similarity_score)
      );
    }

    const context = searchResults.rows
      .map(row => {
        let contextString = `Source: ${row.source_type}`;
        if (row.source_info) contextString += ` (${row.source_info})`;
        if (row.section_type) contextString += ` - Section: ${row.section_type}`;
        contextString += `\nContent: ${row.text}`;

        if (row.class_prerequisites) {
          contextString += `\nPrerequisites: ${row.class_prerequisites}`;
        }
        if (row.class_corequisites) {
          contextString += `\nCorequisites: ${row.class_corequisites}`;
        }

        return contextString;
      })
      .join('\n\n---\n\n');

    const response = await axios.post(
      `${process.env.INFERENCE_URL}/v1/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: `
                    SCOPE: Only answer questions related to:
                    - School policies and procedures
                    - Academic information (courses, programs, requirements)
                    - Campus resources and services
                    - Student life and activities
                    - Admissions and registration
                    - Financial aid and tuition

                    CONTEXT PROVIDED:
                    ${context}

                    INSTRUCTIONS:
                    - If asked about anything outside the scope above, politely redirect to handbook-related topics
                    - Keep responses concise, clear, and student-friendly
                    - Always cite your sources by mentioning the specific handbook page number or website section
                    - If no relevant information is found in the context, say so and suggest contacting the appropriate office
                    - For class information, include prerequisites and corequisites when available
                    - Use a helpful, supportive tone appropriate for students

                    EXAMPLE CITATIONS:
                    - "According to page 45 of the student handbook..."
                    - "Based on the Academic Policies section of the website..."
                    - "As stated in the Financial Aid section..."`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_completion_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.INFERENCE_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.heroku+json; version=3',
        },
      }
    );

    res.json({
      success: true,
      message: response.data.choices[0].message.content,
      model: model,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('AI API Error:', err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: 'Failed to get AI response',
      details: err.response?.data?.message || err.message,
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
