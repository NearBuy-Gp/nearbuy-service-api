import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { FileParsingStrategy } from '../interfaces/file-parsing.interface';
import { CsvParsingStrategy } from '../strategies/csv.strategy';
import { ExcelParsingStrategy } from '../strategies/excel.strategy';
import { ImageParsingStrategy2 } from '../strategies/image.strategy';
import { TextParsingStrategy } from '../strategies/text.strategy';
import { PdfParsingStrategy } from '../strategies/pdf.strategy';
@Injectable()
export class FileParsingStrategyFactory {
  constructor(
    private readonly csvStrategy: CsvParsingStrategy,
    private readonly excelStrategy: ExcelParsingStrategy,
    private readonly pdfStrategy: PdfParsingStrategy,
    private readonly imageStrategy: ImageParsingStrategy2,
    private readonly textStrategy: TextParsingStrategy,
  ) {}

  detectFileType(file: Express.Multer.File): string {
    const mime = file.mimetype;
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    if (mime === 'text/csv' || ext === 'csv') {
      return 'csv';
    }

    if (
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      ext === 'xls' ||
      ext === 'xlsx'
    ) {
      return 'excel';
    }

    if (mime === 'application/pdf' || ext === 'pdf') {
      return 'pdf';
    }

    if (
      mime.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')
    ) {
      return 'image';
    }

    if (mime.startsWith('text/') || ['txt', 'md'].includes(ext || '')) {
      return 'text';
    }

    throw new UnsupportedMediaTypeException(`Unsupported file type: ${mime}`);
  }

  getStrategy(type: string): FileParsingStrategy {
    switch (type) {
      case 'csv':
        return this.csvStrategy;
      case 'excel':
        return this.excelStrategy;
      case 'pdf':
        return this.pdfStrategy;
      case 'image':
        return this.imageStrategy;
      case 'text':
        return this.textStrategy;
      default:
        throw new UnsupportedMediaTypeException(
          `No strategy found for type: ${type}`,
        );
    }
  }
}
