import { Injectable } from '@nestjs/common';
import { FileParsingStrategy } from '../interfaces/file-parsing.interface';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelParsingStrategy implements FileParsingStrategy {
  async parse(file: Express.Multer.File): Promise<any[]> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    if (!rows.length) return [];
    const firstRow = rows[0];
    const isHeaderRow = firstRow.every(
      (cell) => typeof cell === 'string' && cell.trim() !== '',
    );
    let result: any[] = [];

    if (isHeaderRow) {
      const headers = firstRow.map((h) => String(h).trim());
      const dataRows = rows.slice(1);

      result = dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] ?? null;
        });
        return obj;
      });
    } else {
      const columnCount = firstRow.length;
      const headers = Array.from(
        { length: columnCount },
        (_, i) => `column_${i + 1}`,
      );
      result = rows.map((row) => {
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] ?? null;
        });
        return obj;
      });
    }

    return result;
  }
}
