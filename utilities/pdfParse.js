const fs = require('fs');
const pdf = require('pdf-parse');
const splitIntoChunks = require('./splitChunk');
const PDFparser = require('pdf2json');

const pdfp = new PDFparser();

/**
 * @param {string} pdfPath - path to the pdf file that is being parsed
 * @param {string} fileToExtractTo - path for the parsed chunks to be written to
 */
const extractHeavyMetaData = (pdfPath, fileToExtractTo) => {
  pdfp.on('pdfParser_dataError', errData => {
    console.error(errData.parserError);
  });

  pdfp.on('pdfParser_dataReady', pdfData => {
    fs.writeFileSync(`${fileToExtractTo}`, JSON.stringify(pdfData), data => console.log(data));
    console.log(pdfData.Pages);
  });

  pdfp.loadPDF(pdfPath);
};

/**
 * Function that extracts text and page number from PDF for RAG
 *
 *  @param {string} - Path to the pdf to have page and text extracted
 * @returns {Promise<Array<Object>>} - returns a map with page text and index
 */
const extractTextWithPageNo = pdfPath => {
  return new Promise((resolve, reject) => {
    const parser = new PDFparser();

    parser.on('pdfParser_dataReady', pdfData => {
      try {
        const pagesWithText = pdfData.Pages.map((page, index) => {
          const pageTexts = page.Texts.map(textObj => {
            return decodeURIComponent(textObj.R[0].T);
          }).join(' ');

          return {
            pageNumber: index + 1,
            text: pageTexts,
          };
        });

        resolve(pagesWithText);
      } catch (error) {
        reject(error);
      }
    });

    parser.on('pdfParser_dataError', errData => {
      reject(errData.parserError);
    });

    parser.loadPDF(pdfPath);
  });
};

/**
 * Async return function of text and page number extraction
 * that console logs typeof and the page text to the page
 *
 */

const processHandBook = async () => {
  const pdfPathHandBook = '../../rawDataResources/2025-2026-abtech-student-handbook (1).pdf';
  try {
    const pdfWithPageNo = await extractTextWithPageNo(pdfPathHandBook);
    console.log('Type:', typeof pdfWithPageNo);
    console.log(pdfWithPageNo);
  } catch (err) {
    console.error('Error processing PDF', err);
  }
};

const testFileExtract = '../../rawDataResources/testingDataPDFparse1.json';

processHandBook();
