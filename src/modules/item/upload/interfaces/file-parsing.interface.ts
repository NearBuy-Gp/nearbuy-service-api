import { ParsedItemDto } from "../dtos/requests/parsed-item.dto";
import { Express } from "express";
import 'multer';

export interface FileParsingStrategy{
    /**
   * Parse an uploaded file and return an array of extracted items.
   * This method must NEVER throw uncaught errors; it should fail gracefully.
   */
  parse(file: Express.Multer.File): Promise<ParsedItemDto[]>;
}