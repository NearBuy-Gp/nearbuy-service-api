import { BusinessMainCategory } from '../enums/business-category.enum';
import { BusinessType } from '../enums/business-type.enum';

export const CATEGORY_TYPES_MAP: Record<
  BusinessMainCategory,
  BusinessType[]
> = {
  [BusinessMainCategory.STORE]: [
    BusinessType.ELECTRONICS,
    BusinessType.CLOTHING,
    BusinessType.SUPERMARKET,
    BusinessType.PHARMACY,
  ],

  [BusinessMainCategory.RESTAURANT]: [
    BusinessType.FAST_FOOD,
    BusinessType.CAFE,
    BusinessType.DESSERT,
    BusinessType.SEAFOOD,
  ],

  [BusinessMainCategory.CLINIC]: [
    BusinessType.DENTIST,
    BusinessType.DERMATOLOGY,
    BusinessType.PEDIATRIC,
    BusinessType.GENERAL_CLINIC,
  ],

  [BusinessMainCategory.GYM]: [
    BusinessType.CROSSFIT,
    BusinessType.BODYBUILDING,
    BusinessType.PILATES,
  ],

  [BusinessMainCategory.SERVICE]: [
    BusinessType.REPAIR,
    BusinessType.CLEANING,
    BusinessType.BEAUTY,
    BusinessType.CONSULTING,
  ],
};
