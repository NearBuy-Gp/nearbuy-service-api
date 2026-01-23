import { GenerateBusinessAiDto } from '../../dtos/request/business-ai-generation.dto';
import { formatList } from './utils';

export function storePromptV1(data: GenerateBusinessAiDto): string {
  return `
Write a professional retail store description in exactly 2 sentences.

Store name: ${data.name}
Store type: ${data.type}
Main products:
${formatList(data.mainItems)}
Target customers: ${data.targetAudience}

Rules:
- Clear and informative tone
- Focus on product variety and shopping experience
- No promotional language
`;
}
