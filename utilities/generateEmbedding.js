const generateEmbedding = async (text) => {
  const response = await fetch('https://api.heroku.com/managed-inference/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HEROKU_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large', // might need to change this per emnbedding model
      input: text
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
};

module.exports = generateEmbedding;
