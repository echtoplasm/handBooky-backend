const generateEmbedding = require('./generateEmbedding');

const answerQuestion = async (userQuestion) => {
  // 1. Generate embedding for user question
  const questionEmbedding = await generateEmbedding(userQuestion);
  
  // 2. Find similar chunks using pgvector
  const relevantChunks = await pool.query(`
    SELECT content, source, section, metadata,
           1 - (embedding <=> $1) as similarity
    FROM document_chunks
    WHERE 1 - (embedding <=> $1) > 0.7  -- Similarity threshold
    ORDER BY embedding <=> $1
    LIMIT 5
  `, [`[${questionEmbedding.join(',')}]`]);

  // 3. Build context from relevant chunks
  const context = relevantChunks.rows
    .map(row => `Source: ${row.source} (${row.section})\nContent: ${row.content}`)
    .join('\n\n---\n\n');

  // 4. Generate response using Heroku Managed Inference (Claude)
  const response = await fetch('https://api.heroku.com/managed-inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HEROKU_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are a helpful school assistant. Answer questions based on the provided context from the student handbook and school website. If the answer isn't in the context, say so.

Context:
${context}`
        },
        {
          role: 'user',
          content: userQuestion
        }
      ],
      max_tokens: 1000
    })
  });

  const aiResponse = await response.json();
  
  return {
    answer: aiResponse.choices[0].message.content,
    sources: relevantChunks.rows.map(row => ({
      source: row.source,
      section: row.section,
      similarity: row.similarity
    }))
  };
};

export default answerQuestion;
