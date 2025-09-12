const fs = require('fs');
const pdf = require('pdf-parse');
const splitIntoChunks = require('./splitChunk');
const { file } = require('googleapis/build/src/apis/file');

const pdfPathForHandBook = '../../rawDataResources/2025-2026-abtech-student-handbook (1).pdf';

const extractTextFromPdf = async pdfPath => {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);

  return {
    text: data.text,
    'meta-data': data.metadata,
  };
};

const writeToFileForTesting = async (pdfPath) => {
    const fileName = '../../rawDataResources/testingDataPDFparse.json'
  try {
    const content = await extractTextFromPdf(pdfPath);
    fs.writeFileSync(fileName, JSON.stringify(content, null, 2));
    console.log('Success');
  } catch (err) {
    console.error('Unfulfilled promise for file write operation', err);
  }
};

const returnChunksAndText = async () => {
  const pdfText = await extractTextFromPdf(
    '../../rawDataResources/2025-2026-abtech-student-handbook (1).pdf'
  );
  const chunks = splitIntoChunks(pdfText.text);

  console.log(chunks);
};

writeToFileForTesting(pdfPathForHandBook);
