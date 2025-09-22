const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const generateEmbedding = require('./utilities/generateEmbedding.js');
require('dotenv').config();

const { pool } = require('./db.js');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://handbooky-frontend-dev.herokuapp.com',
    'https://handbooky-frontend-575fce723934.herokuapp.com',
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

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

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'claude-3-5-haiku' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userEmbedding = await generateEmbedding(message);

    const searchResults = await pool.query(
      `(
SELECT 
    text,
    page_number::text as source_info,
    'handbook' as source_type,
    NULL as source_url,
    NULL as section_type,
    NULL as class_prerequisites,
    NULL as class_corequisites,
    NULL as course_code,
    (embedding <=> $1::vector) as similarity_score
FROM 
    rag_chunks_handbook
)
UNION ALL
(
SELECT 
    text,
    COALESCE(metadata->>'page', metadata->>'url', 'website') as source_info,
    'website' as source_type,
    metadata->>'url' as source_url,
    metadata->>'section' as section_type,
    CASE 
      WHEN metadata->'prerequisites' IS NOT NULL 
      THEN array_to_string(
        ARRAY(SELECT jsonb_array_elements_text(metadata->'prerequisites')), 
        ', '
      )
      ELSE NULL
    END as class_prerequisites,
    CASE 
      WHEN metadata->'corequisites' IS NOT NULL
      THEN array_to_string(
        ARRAY(SELECT jsonb_array_elements_text(metadata->'corequisites')), 
        ', '
      )
      ELSE NULL
    END as class_corequisites,
    CASE 
      WHEN metadata->>'content_type' = 'course'
      THEN substring(metadata->>'doc_id' from '/([A-Z]{2,4}-\d{2,4})-')
      ELSE null 
    END as course_code,
    (embedding <=> $1::vector) as similarity_score
FROM 
    rag_chunks_website
)
ORDER BY 
    similarity_score
LIMIT 7`,
      [`[${userEmbedding.join(',')}]`]
    );

    console.log('Number of results:', searchResults.rows.length);
    console.log('Course Codes:', searchResults.rows.map(r => r.course_code));
    console.log('Text returned:', searchResults.rows.map(r => r.text.substring(0, 100)));

    console.log(
      'Similarity scores:',
      searchResults.rows.map(r => r.similarity_score)
    );

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

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
