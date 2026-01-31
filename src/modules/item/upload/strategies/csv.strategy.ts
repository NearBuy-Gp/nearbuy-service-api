import { Injectable } from "@nestjs/common";
import { FileParsingStrategy } from "../interfaces/file-parsing.interface";
import { parse } from "csv-parse/sync";

@Injectable()
export class CsvParsingStrategy implements FileParsingStrategy {
  async parse(file: Express.Multer.File): Promise<any[]> {
    const content = file.buffer.toString("utf-8");
    // parse kol el rows removing extra spaces w el empty lines 
    // relax_column_count 3shan lw fe row el columns bta3to > aw < mn el ba'y my3mlsh error
    const rows: any[][] = parse(content, {
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    if (!rows.length) return [];
    // first row can be headers or actual data
    const firstRow = rows[0];
    // check if first row is header (kolo strings w mafesh wahda empty "")
    const isHeaderRow = firstRow.every(
      (cell) => typeof cell === "string" && cell.trim() !== ""
    );
    let result: any[] = [];

    if (isHeaderRow) {
      const headers: string[] = firstRow.map((h) => String(h).trim());
      // remaining rows hya el data
      const dataRows = rows.slice(1);
      // building el object
      result = dataRows.map((row) => {
        const item: any = {};
        headers.forEach((header, i) => {
          item[header] = row[i] ?? null;
        });
        return item;
      });
    } else {
      // "column_1" "column_2" "column_3" ...
      const columnCount = firstRow.length;
      const headers: string[] = Array.from(
        { length: columnCount },
        (_, i) => `column_${i + 1}`
      );
      //convert el data l objects
      result = rows.map((row) => {
        const item: any = {};
        headers.forEach((header, i) => {
          item[header] = row[i] ?? null;
        });
        return item;
      });
    }

    return result;
  }
}
