import { GenerateBusinessAiDto } from '../../dtos/request/business-ai-generation.dto';
import { BusinessCategory } from '../../../business/enums/business-category.enum';

import { restaurantPromptV1 } from './restaurant.v1.prompt';
import { clinicPromptV1 } from './clinic.v1.prompt';
import { gymPromptV1 } from './gym.v1.prompt';
import { servicePromptV1 } from './service.v1.prompt';
import { storePromptV1 } from './store.v1.prompt';

export function buildPromptV1(data: GenerateBusinessAiDto): string {
  switch (data.category) {
    case BusinessCategory.RESTAURANT:
      return restaurantPromptV1(data);

    case BusinessCategory.CLINIC:
      return clinicPromptV1(data);

    case BusinessCategory.GYM:
      return gymPromptV1(data);

    case BusinessCategory.SERVICE:
      return servicePromptV1(data);

    case BusinessCategory.STORE:
      return storePromptV1(data);

    default:
      throw new Error(`Unsupported category for v1: ${data.category}`);
  }
}
