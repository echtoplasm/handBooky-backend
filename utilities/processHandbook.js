const splitIntoChunks = require('./splitChunk.js');
const generateEmbedding = require('./generateEmbedding.js');

const processHandbook = async (handbookText) => {
  const chunks = splitIntoChunks(handbookText, {
    maxTokens: 800,
    overlap: 100
  });

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);
    
    // Store in pgvector database
    await pool.query(`
      INSERT INTO document_chunks (content, embedding, source, section, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      chunk.text,
      `[${embedding.join(',')}]`, // Convert array to pgvector format
      'handbook',
      chunk.section,
      { page: chunk.page, url: chunk.url }
    ]);
  }
};

export default processHandbook;
