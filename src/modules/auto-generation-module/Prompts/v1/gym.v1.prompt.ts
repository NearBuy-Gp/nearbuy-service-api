import { GenerateBusinessAiDto } from '../../dtos/request/business-ai-generation.dto';
import { formatList } from './utils';

export function gymPromptV1(data: GenerateBusinessAiDto): string {
  return `
Write a professional gym description in exactly 2 sentences.

Gym name: ${data.name}
Gym type: ${data.type}
Facilities and services:
${formatList(data.mainItems)}
Target audience: ${data.targetAudience}

Rules:
- Motivational but realistic tone
- Focus on training environment and services
- No exaggerated fitness claims
`;
}
