import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GenerateBusinessAiDto } from './dtos/request/business-ai-generation.dto';
import { CATEGORY_TYPES_MAP } from './constants/category-types.map';
import { buildPromptV1 } from './Prompts/v1/prompets-mapper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AutoGenerationService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('APP_HTTP_REFERER'),
        'X-Title': this.configService.get<string>('APP_X_TITLE'),
      },
    });
  }

  async generateBusinessContent(dto: GenerateBusinessAiDto) {
    if (!CATEGORY_TYPES_MAP[dto.category]?.includes(dto.type)) {
      throw new BadRequestException(
        'Invalid business type for selected category',
      );
    }

    if (!dto.mainItems || dto.mainItems.length === 0) {
      throw new BadRequestException('mainItems must contain at least one item');
    }

    const prompt = buildPromptV1(dto);

    // DESCRIPTION 
    const completion = await this.openai.chat.completions.create({
      model: 'google/gemma-2-9b-it',
      messages: [
        {
          role: 'system',
          content: 'You write concise, engaging local business descriptions. Focus on what makes the business unique. Avoid generic phrases. Use natural, customer-friendly language.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 200, // IMPORTANT for free tier
    });

    const description =
      completion.choices[0]?.message?.content?.trim() ??
      'Professional business description is currently unavailable.';

    // TAGS 
    const tagCompletion = await this.openai.chat.completions.create({
      model: "google/gemma-2-9b-it",
      messages: [
        {
          role: 'user',
          content: `
Generate up to 10 SEO-friendly tags.
Return only comma-separated lowercase words.

Description:
${description}
`,
        },
      ],
      temperature: 0.4,
      max_tokens: 60,
    });

    const rawTags = tagCompletion.choices[0]?.message?.content ?? '';

    const tags = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      description,
      tags,
    };
  }
}
