const generateEmbedding = require('./generateEmbedding.js');
const cleanObjReturn = require('./pdfParse.js');

const processHandbook = async () => {
  const handbookObj = await cleanObjReturn();

  const firstPage = handbookObj[0];
  const embedding = await generateEmbedding(firstPage.text);

  console.log('Embedding length:', embedding.length);
  console.log('First 10 values:', embedding.slice(0, 10));
  /*
  for (const [index, page] of handbookObj.entries()) {
    const embedding = await generateEmbedding(page.text);
*/
  // Store in pgvector database
  /*
    await pool.query(
      `
      INSERT INTO rag_chunks_handbook (text, embedding, page_number, chunk_index)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        chunk.text,
        `[${embedding.join(',')}]`, // Convert array to pgvector format
        page.pageNumber,
        index,
      ]
    );
  */
};

processHandbook();
