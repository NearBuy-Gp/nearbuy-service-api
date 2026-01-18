import { GenerateBusinessAiDto } from '../../dtos/request/business-ai-generation.dto';
import { formatList } from './utils';

export function restaurantPromptV1(data: GenerateBusinessAiDto): string {
  return `
Write a professional Google-style restaurant description in exactly 2 sentences.

Restaurant name: ${data.name}
Cuisine type: ${data.type}
Main dishes:
${formatList(data.mainItems)}
Target audience: ${data.targetAudience}

Rules:
- Clear and professional tone
- Focus on food quality and experience
- No emojis
- No marketing hype
`;
}
