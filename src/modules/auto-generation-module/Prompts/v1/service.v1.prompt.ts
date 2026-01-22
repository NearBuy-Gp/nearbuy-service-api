import { GenerateBusinessAiDto } from '../../dtos/request/business-ai-generation.dto';
import { formatList } from './utils';

export function servicePromptV1(data: GenerateBusinessAiDto): string {
  return `
Write a professional local service business description in exactly 2 sentences.

Business name: ${data.name}
Service type: ${data.type}
Offered services:
${formatList(data.mainItems)}
Target customers: ${data.targetAudience}

Rules:
- Practical and clear tone
- Emphasize reliability and expertise
- No sales language or exaggeration
`;
}
