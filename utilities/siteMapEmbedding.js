const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { pool } = require('../db.js');

require('dotenv').config({ path: '../.env'});

const EMBEDDING_URL = process.env.EMBEDDING_URL;
const EMBEDDING_KEY = process.env.EMBEDDING_KEY;
const EMBEDDING_MODEL_ID = process.env.EMBEDDING_MODEL_ID;

const siteMapPath = path.join(__dirname, '../../rawDataResources/abtech_chunks.jsonl');
const siteMapContent = fs.readFileSync(siteMapPath, 'utf8');

const lines = siteMapContent.trim().split('\n');

console.log(`Total lines: ${lines.length}`);

const siteMapData = [];
lines.forEach((line, index) => {
  try {
    const parsed = JSON.parse(line);
    siteMapData.push(parsed);
  } catch (error) {
    console.log(`Error on line ${index + 1}:`);
    console.log(`Line content: ${line.substring(0, 100)}...`);
    console.log(`Error: ${error.message}`);
  }
});

const siteMapJsonPath = path.join(__dirname, '../../rawDataResources/abtech_chunks.json');
const siteMapJSON = fs.readFileSync(siteMapJsonPath, 'utf-8');

const jsonTrue = JSON.parse(siteMapJSON);

const nonSemanticFilter = json => {
  const semanticObjects = [];
  console.log('Type of json:', typeof json);
  console.log('Is array:', Array.isArray(json));

  json.forEach((obj, index) => {
    try {
      if (obj.text.length > 50) {
        semanticObjects.push(obj);
      }
    } catch (error) {
      console.error('unable to parse json', error.message);
    }
  });

  return semanticObjects;
};

const generateSiteMapEmbedding = async text => {
  try {
    const response = await axios.post(
      `${EMBEDDING_URL}/v1/embeddings`,
      {
        model: EMBEDDING_MODEL_ID,
        input: [text],
        input_type: 'search_document',
      },
      {
        headers: {
          Authorization: `Bearer ${EMBEDDING_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data[0].embedding;
  } catch (err) {
    console.error('Unable to generate embedding', err.response?.data || err.message);
  }
};

const insertSiteMapEmbedding = async () => {
  let failed = 0;
  const semanticObj = await nonSemanticFilter(jsonTrue);

  for (const [index, page] of semanticObj.entries()) {
    try {
      const truncatedText = page.text.length > 2000 ? page.text.substring(0, 2000) : page.text;
      const embedding = await generateSiteMapEmbedding(truncatedText);

      await pool.query(
        `
          Insert into rag_chunks_website (website_chunk_id ,text, embedding, metadata)
          values ($1, $2, $3, $4)
        `,
        [page.id, truncatedText, JSON.stringify(embedding), JSON.stringify(page.metadata)]
      );
    } catch (err) {
      failed++;
      console.error(`Failed to process website_chunk ${index}`, err.message);
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`number of failed insertions: ${failed}`);
};

insertSiteMapEmbedding();
