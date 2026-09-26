import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function parseFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === 'application/pdf') {
        try {
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let standardText = '';

            // --- Phase 1: Standard Text Extraction ---
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                standardText += pageText + '\n\n';
            }

            // --- Phase 2: Hybrid Check & OCR Fallback ---
            const simplifiedText = standardText.replace(/\s/g, '');
            if (simplifiedText.length > 100) {
                console.log(`[fileParser] Standard extraction successful (${simplifiedText.length} chars).`);
                return standardText;
            }

            console.warn(`[fileParser] Standard extraction failed or detected minimal text (${simplifiedText.length} chars). Starting OCR fallback...`);

            let ocrText = '';
            // Use local worker and core to comply with Chrome Extension CSP (Manifest V3)
            const worker = await createWorker('eng+chi_tra', 1, {
                workerPath: chrome.runtime.getURL('lib/tesseract/worker.min.js'),
                corePath: chrome.runtime.getURL('lib/tesseract/tesseract-core.wasm.js'),
                logger: m => console.log('[Tesseract]', m),
            });

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);

                // Render page to canvas for OCR
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                    canvas: canvas
                }).promise;

                // Perform OCR on the canvas
                const { data: { text } } = await worker.recognize(canvas);
                ocrText += text + '\n\n';
                console.log(`[fileParser] OCR Page ${i} complete.`);
            }

            await worker.terminate();
            return ocrText.trim() || standardText; // Return OCR text, or fallback to whatever standard text we had

        } catch (error: any) {
            console.error('PDF parsing error details:', {
                message: error.message,
                stack: error.stack,
                error
            });
            throw new Error(`PDF Parsing failed: ${error.message || 'Unknown error'}. If this is a Figma PDF, there might be a security restriction in the browser.`);
        }
    } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
    ) {
        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Word parsing error:', error);
            throw new Error('Failed to parse Word document in browser.');
        }
    } else {
        throw new Error('Unsupported file type. Please upload a PDF or Word document.');
    }
}
