const splitIntoChunks = (text, options = {}) => {
  const { maxTokens = 800, overlap = 100 } = options;

  // Simple sentence-based chunking (you can make this more sophisticated)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  let tokenCount = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (tokenCount + sentenceTokens > maxTokens && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        tokenCount,
      });

      // Start new chunk with overlap
      const overlapText = getLastSentences(currentChunk, overlap);
      currentChunk = overlapText + ' ' + sentence;
      tokenCount = estimateTokens(currentChunk);
    } else {
      currentChunk += ' ' + sentence;
      tokenCount += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      tokenCount,
    });
  }

  return chunks;
};

const estimateTokens = text => {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
};

const getLastSentences = (chunk, overlapTokens) => {
  const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let overlap = '';
  let tokenCount = 0;

  // Work backwards through sentences until we hit the overlap limit
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokens(sentence);

    if (tokenCount + sentenceTokens > overlapTokens) break;

    overlap = sentence + '. ' + overlap;
    tokenCount += sentenceTokens;
  }

  return overlap.trim();
};
module.exports = splitIntoChunks;
