const generateEmbedding = require('./generateEmbedding.js');
const cleanObjReturn = require('./pdfParse.js');
const { pool } = require('../db.js');

const processHandbook = async () => {
  const handbookObj = await cleanObjReturn();

  for (const [index, page] of handbookObj.entries()) {
    try {
      const embedding = await generateEmbedding(page.text);
      // Store in pgvector database
      await pool.query(
        `
      INSERT INTO rag_chunks_handbook (text, embedding, page_number, chunk_index)
      VALUES ($1, $2, $3, $4)
    `,
        [
          page.text,
          JSON.stringify(embedding), // Convert array to pgvector format
          page.pageNumber,
          index,
        ]
      );
    } catch (error) {
      console.error(`Failed to process chunk ${index}:`, error.message);
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};
processHandbook();
