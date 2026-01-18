import { GenerateBusinessAiDto } from '../dtos/request/business-ai-generation.dto';
import { BusinessMainCategory } from '../enums/business-category.enum';

function formatList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}

export function buildPrompt(data: GenerateBusinessAiDto): string {
  const mainItemsFormatted = formatList(data.mainItems);

  switch (data.category) {

    //  RESTAURANT
    case BusinessMainCategory.RESTAURANT:
      return `
Write a professional Google-style restaurant description (2 sentences).

Restaurant name: ${data.name}
Cuisine type: ${data.type}
Main dishes:
${mainItemsFormatted}
Target customers: ${data.targetAudience}

Rules:
- Clear and professional
- No emojis
- No exaggerated marketing language
`;

    //  CLINIC
    case BusinessMainCategory.CLINIC:
      return `
Write a professional medical clinic description (2 sentences).

Clinic name: ${data.name}
Specialization: ${data.type}
Medical services:
${mainItemsFormatted}
Target patients: ${data.targetAudience}

Rules:
- Medical and trustworthy tone
- No promises, guarantees, or exaggeration
`;

    //  GYM
    case BusinessMainCategory.GYM:
      return `
Write a professional gym description (2 sentences).

Gym name: ${data.name}
Gym type: ${data.type}
Facilities & services:
${mainItemsFormatted}
Target audience: ${data.targetAudience}

Rules:
- Motivational but realistic
- Professional tone
- No hype language
`;

    // SERVICE 
    case BusinessMainCategory.SERVICE:
      return `
Write a professional local service business description (2 sentences).

Business name: ${data.name}
Service type: ${data.type}
Main services:
${mainItemsFormatted}
Target customers: ${data.targetAudience}

Rules:
- Clear and reliable tone
- Focus on practical value
- No exaggerated claims
`;

    // STORE 
    case BusinessMainCategory.STORE:
      return `
Write a professional retail store description (2 sentences).

Store name: ${data.name}
Store type: ${data.type}
Main products:
${mainItemsFormatted}
Target customers: ${data.targetAudience}

Rules:
- Clear and customer-friendly
- Professional tone
- No promotional hype
`;

    // ❌ Safety fallback (should never happen if validation is correct)
    default:
      return `
Write a professional business description (2 sentences).

Business name: ${data.name}
Category: ${data.category}
Type: ${data.type}
Offerings:
${mainItemsFormatted}

Rules:
- Neutral professional tone
`;
  }
}
