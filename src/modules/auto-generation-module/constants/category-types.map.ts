import { BusinessCategory } from '../../business/enums/business-category.enum';
import { BusinessType } from '../../business/enums/business-type.enum';

export const CATEGORY_TYPES_MAP: Record<BusinessCategory, BusinessType[]> = {
  [BusinessCategory.STORE]: [BusinessType.ELECTRONICS, BusinessType.CLOTHING, BusinessType.SUPERMARKET, BusinessType.PHARMACY],

  [BusinessCategory.RESTAURANT]: [BusinessType.FAST_FOOD, BusinessType.CAFE, BusinessType.DESSERT, BusinessType.SEAFOOD],

  [BusinessCategory.CLINIC]: [BusinessType.DENTIST, BusinessType.DERMATOLOGY, BusinessType.PEDIATRIC, BusinessType.GENERAL_CLINIC],

  [BusinessCategory.GYM]: [BusinessType.CROSSFIT, BusinessType.BODYBUILDING, BusinessType.PILATES],

  [BusinessCategory.SERVICE]: [BusinessType.REPAIR, BusinessType.CLEANING, BusinessType.BEAUTY, BusinessType.CONSULTING],
};
