import { BusinessCategory } from '../../../business/enums/business-category.enum';
import { BusinessType } from '../../../business/enums/business-type.enum';

export class NormalizeInputDto {
  rawData: any[];
  businessCategory: BusinessCategory;
  businessType: BusinessType;
  businessId: string;
}
