const fs = require('fs');
const pdf = require('pdf-parse');
const splitIntoChunks  = require('./splitChunk');


const extractTextFromPdf = async pdfPath => {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);

  return data.text;
};

const returnChunksAndText = async () => {
  const pdfText = await extractTextFromPdf(
    '../../rawDataResources/2025-2026-abtech-student-handbook (1).pdf'
  );
  const chunks = splitIntoChunks(pdfText);

  console.log(chunks);
};

returnChunksAndText();
