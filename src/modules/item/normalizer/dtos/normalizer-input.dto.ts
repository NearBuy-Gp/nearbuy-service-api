import { BusinessCategory } from "src/modules/business/enums/business-category.enum";
import { BusinessType } from "src/modules/business/enums/business-type.enum";

export class NormalizeInputDto {
  rawData: any[];
  businessCategory: BusinessCategory;
  businessType: BusinessType;
  businessId: string;
}