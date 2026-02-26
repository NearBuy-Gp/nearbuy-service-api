// 1- read el file
// 2- extract el text
// 3- split el text l lines
// 4- remove el whitespaces
// 5- remove empty lines
// 6- convert l array {text: string}
import { Injectable } from '@nestjs/common';
import { FileParsingStrategy } from '../interfaces/file-parsing.interface';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

@Injectable()
export class PdfParsingStrategy implements FileParsingStrategy {
  async parse(file: Express.Multer.File): Promise<any[]> {
    if (!file.buffer) throw new Error('No file buffer found');

    try {
      const uint8Array = new Uint8Array(file.buffer);

      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      const lines = fullText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      return lines.map((line: string) => ({ text: line }));
    } catch (error) {
      console.error('PDF Strategy Error:', error);
      return [
        {
          error: 'Extraction failed',
          details: error.message,
        },
      ];
    }
  }
}
