import { Injectable } from "@nestjs/common";
import { FileParsingStrategy } from "../interfaces/file-parsing.interface";

@Injectable()
export class TextParsingStrategy implements FileParsingStrategy{
    async parse(file:Express.Multer.File): Promise<any[]>{
        const content = file.buffer.toString('utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map(line => ({text:line}));
    }
}