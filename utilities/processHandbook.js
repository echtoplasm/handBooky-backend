const splitIntoChunksByTokens = require('./splitChunk.js');
const generateEmbedding = require('./generateEmbedding.js');
const cleanObjReturn = require('./pdfParse.js');

const processHandbook = async () => {
  // Split into chunks (aim for ~500-1000 tokens per chunk)
  const handbookObj = await cleanObjReturn();
  
  for (const [index, page] of handbookObj.entries()) {
    //const embedding = await generateEmbedding(page.text);
    
    // Store in pgvector database
    /*
    await pool.query(`
      INSERT INTO rag_chunks_handbook (text, embedding, page_number, chunk_index)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      chunk.text,
      `[${embedding.join(',')}]`, // Convert array to pgvector format
        page.pageNumber,
       index 
    ]);
  */  
   console.log(page.text);
  }
}
processHandbook();

