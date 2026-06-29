/**
 * The single source of truth for full-coverage seeding.
 *
 * `BusinessType` has 34 values; the app's CATEGORY_TYPES_MAP only validly maps
 * 19 of them to a `BusinessCategory`. Per the approved plan we seed ALL 34,
 * force-assigning the 15 "orphan" types a best-guess category + a valid
 * `ItemType` whose categories exist in ITEM_CATEGORY_SEED.
 *
 * Only ItemTypes that are safe for seeding are used here:
 *   RESTAURANT, CLINIC, CLASS_SESSION, SUPER_MARKET_PRODUCT, PHARMACY_PRODUCT,
 *   CLOTHING_PRODUCT, ELECTRONICS_PRODUCT (all have registered discriminators +
 *   seed categories), and SERVICE (no discriminator → base doc, no typed attributes).
 * MENU_ITEM / PRODUCT (no seed categories) and MEMBERSHIP (no embed-builder
 * support) are intentionally avoided.
 */
import { BusinessCategory } from '../../../modules/business/enums/business-category.enum';
import { BusinessType } from '../../../modules/business/enums/business-type.enum';
import { ItemType } from '../../../modules/item/enums/item-type.enum';
import { CATEGORY_TYPES_MAP } from '../../../modules/auto-generation-module/constants/category-types.map';

export interface TypePlanEntry {
  category: BusinessCategory;
  itemType: ItemType;
  /** True when the (category,type) pair is NOT in the app's CATEGORY_TYPES_MAP. */
  orphan: boolean;
}

/** Best-guess assignment for the 15 types missing from CATEGORY_TYPES_MAP. */
const ORPHAN_ASSIGNMENT: Record<string, { category: BusinessCategory; itemType: ItemType }> = {
  [BusinessType.FASHION]: { category: BusinessCategory.STORE, itemType: ItemType.CLOTHING_PRODUCT },
  [BusinessType.GROCERY]: { category: BusinessCategory.STORE, itemType: ItemType.SUPER_MARKET_PRODUCT },
  [BusinessType.HEALTH]: { category: BusinessCategory.STORE, itemType: ItemType.PHARMACY_PRODUCT },
  [BusinessType.SPORTS]: { category: BusinessCategory.STORE, itemType: ItemType.SUPER_MARKET_PRODUCT },
  [BusinessType.HOME]: { category: BusinessCategory.STORE, itemType: ItemType.SUPER_MARKET_PRODUCT },
  [BusinessType.TOYS]: { category: BusinessCategory.STORE, itemType: ItemType.SUPER_MARKET_PRODUCT },
  [BusinessType.MEDICAL]: { category: BusinessCategory.CLINIC, itemType: ItemType.CLINIC },
  [BusinessType.SALON]: { category: BusinessCategory.SERVICE, itemType: ItemType.SERVICE },
  [BusinessType.FITNESS]: { category: BusinessCategory.GYM, itemType: ItemType.CLASS_SESSION },
  [BusinessType.EDUCATION]: { category: BusinessCategory.SERVICE, itemType: ItemType.SERVICE },
  [BusinessType.AUTOMOTIVE]: { category: BusinessCategory.SERVICE, itemType: ItemType.SERVICE },
  [BusinessType.FOOD_AND_BEVERAGE]: { category: BusinessCategory.RESTAURANT, itemType: ItemType.RESTAURANT },
  [BusinessType.ENTERTAINMENT]: { category: BusinessCategory.SERVICE, itemType: ItemType.SERVICE },
  [BusinessType.TRAVEL]: { category: BusinessCategory.SERVICE, itemType: ItemType.SERVICE },
  [BusinessType.OTHER]: { category: BusinessCategory.SERVICE, itemType: ItemType.SERVICE },
};

/** ItemType for each of the 19 validly-mapped types. */
const VALID_ITEM_TYPE: Record<string, ItemType> = {
  [BusinessType.ELECTRONICS]: ItemType.ELECTRONICS_PRODUCT,
  [BusinessType.CLOTHING]: ItemType.CLOTHING_PRODUCT,
  [BusinessType.SUPERMARKET]: ItemType.SUPER_MARKET_PRODUCT,
  [BusinessType.PHARMACY]: ItemType.PHARMACY_PRODUCT,
  [BusinessType.FAST_FOOD]: ItemType.RESTAURANT,
  [BusinessType.CAFE]: ItemType.RESTAURANT,
  [BusinessType.DESSERT]: ItemType.RESTAURANT,
  [BusinessType.SEAFOOD]: ItemType.RESTAURANT,
  [BusinessType.DENTIST]: ItemType.CLINIC,
  [BusinessType.DERMATOLOGY]: ItemType.CLINIC,
  [BusinessType.PEDIATRIC]: ItemType.CLINIC,
  [BusinessType.GENERAL_CLINIC]: ItemType.CLINIC,
  [BusinessType.CROSSFIT]: ItemType.CLASS_SESSION,
  [BusinessType.BODYBUILDING]: ItemType.CLASS_SESSION,
  [BusinessType.PILATES]: ItemType.CLASS_SESSION,
  [BusinessType.REPAIR]: ItemType.SERVICE,
  [BusinessType.CLEANING]: ItemType.SERVICE,
  [BusinessType.BEAUTY]: ItemType.SERVICE,
  [BusinessType.CONSULTING]: ItemType.SERVICE,
};

/** Reverse-lookup category for a valid type from CATEGORY_TYPES_MAP. */
function validCategoryFor(type: BusinessType): BusinessCategory | undefined {
  for (const [category, types] of Object.entries(CATEGORY_TYPES_MAP)) {
    if (types.includes(type)) return category as BusinessCategory;
  }
  return undefined;
}

/** Build the full 34-type plan. */
export function buildTypePlan(): Record<BusinessType, TypePlanEntry> {
  const plan = {} as Record<BusinessType, TypePlanEntry>;
  for (const type of Object.values(BusinessType)) {
    const validCategory = validCategoryFor(type);
    if (validCategory && VALID_ITEM_TYPE[type]) {
      plan[type] = { category: validCategory, itemType: VALID_ITEM_TYPE[type], orphan: false };
    } else {
      const orphan = ORPHAN_ASSIGNMENT[type];
      if (!orphan) {
        throw new Error(`No plan entry for business type "${type}" — update type-plan.ts`);
      }
      plan[type] = { category: orphan.category, itemType: orphan.itemType, orphan: true };
    }
  }
  return plan;
}

export const ALL_BUSINESS_TYPES = Object.values(BusinessType);
export const ALL_BUSINESS_CATEGORIES = Object.values(BusinessCategory);
