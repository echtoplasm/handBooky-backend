const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const EMBEDDING_URL = process.env.EMBEDDING_URL;
const EMBEDDING_KEY = process.env.EMBEDDING_KEY;
const EMBEDDING_MODEL_ID = process.env.EMBEDDING_MODEL_ID;

/*
if (!EMBEDDING_URL || !EMBEDDING_KEY || !EMBEDDING_MODEL_ID) {
  console.error('Missing required environment variables.');
  console.log('Set them up using the following commands:');
  console.log('export EMBEDDING_URL=$(heroku config:get -a $APP_NAME EMBEDDING_URL)');
  console.log('export EMBEDDING_KEY=$(heroku config:get -a $APP_NAME EMBEDDING_KEY)');
  console.log('export EMBEDDING_MODEL_ID=$(heroku config:get -a $APP_NAME EMBEDDING_MODEL_ID)');
  process.exit(1);
}
*/
const parseEmbeddingOutput = response => {
  if (response.status === 200) {
    console.log('Embeddings:', response.data.data);
  } else {
    console.log(`Request Failed: ${response.status}, ${response.statusText}`);
  }
};

const generateEmbedding = async text => {
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
  } catch (error) {
    console.error('Error generating embeddings', error.response?.data || error.message);
  }
};

module.exports = generateEmbedding;
