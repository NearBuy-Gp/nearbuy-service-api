import { Injectable } from "@nestjs/common";
import { FileParsingStrategy } from "../interfaces/file-parsing.interface";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageParsingStrategy2 implements FileParsingStrategy {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  async parse(file: Express.Multer.File): Promise<any[]> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: "models/gemini-2.5-flash" 
      });

      const prompt = `Extract all items from this menu or service list image.
      
Return ONLY a JSON array (no markdown, no extra text) where each item has:
- name: string (the item/service name)
- price: number (extract the price, use 0 if not found)
- description: string (any description or details, empty string if none)

Example format:
[
  {"name": "Coffee", "price": 3.50, "description": "Freshly brewed"},
  {"name": "Tea", "price": 2.50, "description": ""}
]`;

      const imagePart = {
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Clean potential markdown code blocks
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      const items = JSON.parse(cleanedText);
      return Array.isArray(items) ? items : [];
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to extract items from image: ${error.message}`);
    }
  }
}