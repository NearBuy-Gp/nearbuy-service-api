import { GenerateBusinessAiDto } from '../../dtos/request/business-ai-generation.dto';
import { formatList } from './utils';

export function clinicPromptV1(data: GenerateBusinessAiDto): string {
  return `
Write a professional medical clinic description in exactly 2 sentences.

Clinic name: ${data.name}
Specialization: ${data.type}
Services:
${formatList(data.mainItems)}
Target patients: ${data.targetAudience}

Rules:
- Medical, trustworthy tone
- No promises or exaggeration
- Clear and factual language
`;
}
