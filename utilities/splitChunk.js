const splitIntoChunksByTokens = (data, options = {}) => {
  const { maxTokens = 400, overlap = 100 } = options;
  
  const CHARS_PER_TOKEN = 4;
  const MAX_CHUNK_CHARS = maxTokens * CHARS_PER_TOKEN;
  const MIN_CHUNK_CHARS = Math.floor(MAX_CHUNK_CHARS * 0.4);
  const OVERLAP_CHARS = overlap * CHARS_PER_TOKEN;
  
  const chunks = [];
  let currentChunk = '';
  let currentPageNumber = null;
  
  data.forEach(element => {
    const sentences = element.text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      const formattedSentence = trimmedSentence.endsWith('.') || 
                                trimmedSentence.endsWith('!') || 
                                trimmedSentence.endsWith('?') 
                                ? trimmedSentence : trimmedSentence + '.';
      
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + formattedSentence;
      
      if (potentialChunk.length > MAX_CHUNK_CHARS && currentChunk.length > 0) {
        if (currentChunk.length >= MIN_CHUNK_CHARS) {
          chunks.push({ 
            pageNumber: currentPageNumber, 
            text: currentChunk.trim(),
            estimatedTokens: Math.ceil(currentChunk.length / CHARS_PER_TOKEN)
          });
        }
        
        // Handle overlap
        if (OVERLAP_CHARS > 0 && currentChunk.length > OVERLAP_CHARS) {
          const overlapText = currentChunk.slice(-OVERLAP_CHARS);
          currentChunk = overlapText + ' ' + formattedSentence;
        } else {
          currentChunk = formattedSentence;
        }
      } else {
        currentChunk = potentialChunk;
      }
      
      currentPageNumber = element.pageNumber;
    }
  });
  
  if (currentChunk.trim() && currentChunk.length >= MIN_CHUNK_CHARS) {
    chunks.push({ 
      pageNumber: currentPageNumber, 
      text: currentChunk.trim(),
      estimatedTokens: Math.ceil(currentChunk.length / CHARS_PER_TOKEN)
    });
  }
  
  return chunks;
};

module.exports = splitIntoChunksByTokens; 
