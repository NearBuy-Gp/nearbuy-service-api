/**
 * Real Egyptian chains / brands / service providers extracted from the search
 * model's training set (`nearbuy_final_v2.csv`, the `brand` column).
 *
 * The v2 seeder names a slice of every business type after these real brands
 * (cycled deterministically by instance index) so that brand-name queries the
 * Transformer was trained on — "carrefour maadi", "el ezaby pharmacy",
 * "starbucks tagamoa", "b.tech iphone", "gold's gym nasr city" — resolve to a
 * concrete, queryable business record. Types without a real chain in the CSV
 * fall back to the baladi storefront generator in `egypt.ts`.
 */
import { BusinessType } from '../../../modules/business/enums/business-type.enum';

export const BRANDS_BY_TYPE: Partial<Record<BusinessType, string[]>> = {
  // Food / fast food chains
  [BusinessType.FAST_FOOD]: [
    "Mo'men", "McDonald's Egypt", 'KFC Egypt', 'Buffalo Burger', 'Burger King',
    'Pizza Hut', 'Bazooka', 'Cook Door', 'Abou Tarek', 'Petra',
  ],
  [BusinessType.FOOD_AND_BEVERAGE]: ['Abou Tarek', 'Petra', 'Cook Door', 'Bazooka'],

  // Cafes
  [BusinessType.CAFE]: ['Starbucks Egypt', 'Cilantro', 'Costa Coffee Egypt', 'B Laban'],

  // Dessert / patisserie
  [BusinessType.DESSERT]: ['B Laban', 'El Abd Patisserie'],

  // Supermarkets & grocery
  [BusinessType.SUPERMARKET]: [
    'Carrefour Egypt', 'Seoudi Supermarket', 'Hyper One', 'Kazyon', 'Awlad Ragab',
    'Spinneys Egypt', 'Metro Market Egypt', 'Gourmet Egypt', 'Breadfast',
  ],
  [BusinessType.GROCERY]: ['Kazyon', 'Awlad Ragab', 'Metro Market Egypt', 'Hyper One'],

  // Pharmacies
  [BusinessType.PHARMACY]: [
    'El Ezaby Pharmacy', 'Seif Pharmacy', 'Roshdy Pharmacy', '19011 Pharmacy', 'El Attar Pharmacy',
  ],
  [BusinessType.HEALTH]: ['El Ezaby Pharmacy', 'Seif Pharmacy'],

  // Electronics retailers (CSV product brands sit on the items, not the store)
  [BusinessType.ELECTRONICS]: ['B.Tech', '2B Computers', 'Tradeline Apple', 'Samsung Brand Store'],

  // Fashion / clothing
  [BusinessType.CLOTHING]: [
    'Zara', 'H&M', 'Pull&Bear', 'Bershka', 'Defacto', 'Town Team', 'Concrete',
    'LC Waikiki', 'American Eagle', 'Nike Store', 'Adidas Store', 'Magma Sportswear', 'Sigma Fit',
  ],
  [BusinessType.FASHION]: ['Zara', 'H&M', 'Pull&Bear', 'Bershka', 'Defacto', 'Concrete'],

  // Telecom / consulting service providers
  [BusinessType.CONSULTING]: ['Vodafone Egypt', 'Etisalat Egypt', 'WE', 'Orange Egypt'],

  // Gyms
  [BusinessType.BODYBUILDING]: ["Gold's Gym", 'Sigma Fit'],
  [BusinessType.FITNESS]: ["Gold's Gym", 'Sigma Fit'],
  [BusinessType.CROSSFIT]: ["Gold's Gym"],

  // Clinics (one branded medical center appears in the CSV)
  [BusinessType.GENERAL_CLINIC]: ['Curexmed'],
};

/**
 * Brand for a given (type, index). When `index` is provided we cycle the brand
 * list so the first `brands.length` instances of a type deterministically cover
 * every brand (run with `--count >= brands.length` to materialise them all).
 * Returns null for types that have no real chain — those stay baladi-named.
 */
export function brandForIndex(type: BusinessType, index?: number): string | null {
  const list = BRANDS_BY_TYPE[type];
  if (!list || list.length === 0) return null;
  if (index === undefined) return null;
  return list[index % list.length];
}
