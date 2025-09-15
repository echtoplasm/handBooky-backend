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

app.post('/handbooks', async (req, res) => {
  try {
    const {
      handbook_id,
      title,
      description,
      file_path,
      file_size,
      upload_user_id,
      school_id,
      grade_level,
      subject,
      academic_year,
      is_public,
    } = req.body;

    const query = `
      INSERT into handbooks
      (handbook_id, title, description, file_path,
        upload_user_id, school_id, grade_level, subject, academic_year, 
        is_public)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning *
      `;

    const values = [
      handbook_id,
      title,
      description || null,
      file_path,
      file_size || null,
      upload_user_id,
      school_id,
      grade_level,
      subject,
      academic_year,
      is_public,
    ];

    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
  }
});

app.post('/air', async (req, res) => {
  try {
    const {
      resource_id,
      section_id,
      handbook_id,
      resource_type,
      title,
      content,
      content_embedding,
      difficulty_level,
      estimated_time_minutes,
      generated_by_model,
    } = req.body;

    const query = `insert into ai_resources 
                        (resource_id, section_id, handbook_id, resource_type,
                         title, content, content_embedding, difficulty_level, estimated_time_minutes, 
                            generated_by_model)
                    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    returning *`;

    const values = [
      resource_id,
      section_id,
      handbook_id,
      resource_type,
      title,
      content,
      content_embedding,
      difficulty_level,
      estimated_time_minutes,
      generated_by_model,
    ];

    const insertAiResources = await pool.query(query, values);

    res.json({ message: 'ai resource inserted' });
  } catch (err) {
    console.error('Unable to post ai resources', err.message);
    return res.status(404).json({ error: 'Unable to post ai resource' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'claude-3-5-haiku' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userEmbedding = await generateEmbedding(message);

    const searchResults = await pool.query(
      `
      select text, page_number, (embedding <=> $1::vector) as similarity_score
      from rag_chunks_handbook
      order by embedding <=> $1::vector
      limit 3
`,
      [`[${userEmbedding.join(',')}]`]
    );

    const context = searchResults.rows.map(row => row.text).join('\n\n');

    const response = await axios.post(
      `${process.env.INFERENCE_URL}/v1/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for a student handbook app.
                      Only answer questions related to:
                      - SChool policies and procedures
                      - Academic information 
                      - Campus resources 
                      - Student Life
                    
                    Here is the the context for the handbook: ${context}, 

                    If asked about anything else, politely redirect to handbook related topics.
                    Keep responses concise and student friendly.
                    `,
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
