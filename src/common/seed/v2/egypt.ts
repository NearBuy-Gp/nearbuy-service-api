/**
 * Egyptian localization data + helpers shared across the v2 seeders.
 *
 * Centralizes authentic, everyday-Egypt content so catalogs, users and
 * businesses all draw from the same culturally-consistent pools:
 *   - tripartite Egyptian names (first + father + family),
 *   - real Cairo districts / streets for addresses + business naming,
 *   - local mobile numbers (+20 1X …), and
 *   - baladi storefront naming styles per business type.
 *
 * All randomness goes through the shared seeded `faker` (./rng) so runs stay
 * reproducible. Item content lives in `catalog.faker.ts`; this file is the
 * people/place/identity layer.
 */
import { BusinessType } from '../../../modules/business/enums/business-type.enum';
import { faker } from './rng';

// ── People ────────────────────────────────────────────────────────────────
export const MALE_FIRST_NAMES = [
  'Mohamed', 'Ahmed', 'Mahmoud', 'Mostafa', 'Youssef', 'Omar', 'Khaled', 'Hassan', 'Hussein', 'Ali',
  'Tarek', 'Karim', 'Amr', 'Sayed', 'Ibrahim', 'Sherif', 'Sameh', 'Ehab', 'Hany', 'Ashraf',
  'Wael', 'Tamer', 'Ramy', 'Hesham', 'Adel', 'Magdy', 'Sabry', 'Fathy', 'Islam', 'Abdelrahman',
];

export const FEMALE_FIRST_NAMES = [
  'Fatma', 'Aya', 'Mariam', 'Nour', 'Salma', 'Heba', 'Dina', 'Yasmin', 'Mona', 'Amira',
  'Rana', 'Sara', 'Hadeer', 'Esraa', 'Doaa', 'Shaimaa', 'Nada', 'Reham', 'Marwa', 'Walaa',
  'Nesma', 'Asmaa', 'Menna', 'Habiba', 'Farida', 'Malak', 'Rowan', 'Jana', 'Aliaa', 'Engy',
];

/** Used both as the father's name (middle) and the family name (last). */
export const FAMILY_NAMES = [
  'El Sayed', 'Abdel Rahman', 'Abdel Aziz', 'Hassan', 'Mahmoud', 'El Masry', 'Mansour', 'Soliman',
  'El Sherbiny', 'Abou Zeid', 'El Gendy', 'Fahmy', 'Shaker', 'El Deeb', 'Zaki', 'Ramadan',
  'Abdallah', 'El Naggar', 'Saad', 'El Shennawy', 'Fayed', 'Eid', 'Helmy', 'Nassar', 'Okasha',
  'El Far', 'Kamel', 'Sobhy', 'El Tonsy', 'Selim',
];

// ── Places (Greater Cairo) ──────────────────────────────────────────────────
export const CAIRO_DISTRICTS = [
  'Nasr City', 'Masr El Gedida', 'Maadi', 'Zamalek', 'Mohandessin', 'Dokki', 'Shubra', 'Helwan',
  'Ain Shams', 'El Matareya', 'Sayeda Zeinab', 'El Mokattam', 'New Cairo', 'El Tagamoa El Khames',
  '6th of October', 'Faisal', 'Haram', 'Imbaba', 'Garden City', 'El Manial', 'Abbassia', 'El Rehab',
  'Sheraton', 'El Zaytoun', 'Madinaty', 'El Marg',
];

export const CAIRO_STREETS = [
  'Abbas El Akkad', 'Makram Ebeid', 'Mostafa El Nahas', 'El Tayaran', 'Mousadak', 'El Hegaz',
  'El Thawra', 'Ahmed Orabi', 'Gameat El Dewal El Arabia', 'El Merghany', 'Cleopatra', 'Road El Farag',
  'El Nozha', 'El Lasilky', 'Street 9', 'Street 250', 'El Batal Ahmed Abdel Aziz', 'Syria Street',
];

// ── Storefront naming ───────────────────────────────────────────────────────
/** Blessed/common words (transliterated) that headline baladi storefronts. */
const BARAKA_WORDS = [
  'El Kheir', 'El Baraka', 'El Nour', 'El Amana', 'El Tawfik', 'El Saad', 'El Rahma', 'El Ekhlas',
  'El Safa', 'El Gawda', 'El Aseel', 'El Horreya', 'El Zohour', 'El Nokhba', 'El Madina', 'El Malek',
  'El Shaheer', 'El Wafaa', 'El Salam', 'El Andalos',
];

/** Storefront prefix per business type (transliterated baladi commercial feel). */
const STOREFRONT_PREFIX: Partial<Record<BusinessType, string[]>> = {
  [BusinessType.SUPERMARKET]: ['Super Market', 'Bakala', 'Market', 'Mall'],
  [BusinessType.GROCERY]: ['Bakala', 'Super Market', 'Tamwinat'],
  [BusinessType.FAST_FOOD]: ['Matam', 'Koshary', 'Hawawshi House', 'Grill'],
  [BusinessType.FOOD_AND_BEVERAGE]: ['Matam & Mashwiyat', 'Matam', 'Kababgy'],
  [BusinessType.CAFE]: ['Cafe', 'Ahwa', 'Coffee Shop', 'El Cafe'],
  [BusinessType.DESSERT]: ['Halawany', 'Patisserie', 'Fatatry'],
  [BusinessType.SEAFOOD]: ['Asmak', 'Fish Market', 'El Sayyad'],
  [BusinessType.PHARMACY]: ['Pharmacy', 'Agzakhana'],
  [BusinessType.HEALTH]: ['Pharmacy', 'Health Center'],
  [BusinessType.ELECTRONICS]: ['Mobile Shop', 'Electronics', 'Techno'],
  [BusinessType.CLOTHING]: ['Clothing Store', 'Boutique', 'Azyaa'],
  [BusinessType.FASHION]: ['Boutique', 'Fashion', 'Azyaa'],
  [BusinessType.DENTIST]: ['Dental Clinic', 'Dental Center'],
  [BusinessType.DERMATOLOGY]: ['Derma Clinic', 'Beauty Center'],
  [BusinessType.PEDIATRIC]: ['Pediatric Clinic', 'Kids Center'],
  [BusinessType.GENERAL_CLINIC]: ['Clinic', 'Medical Center'],
  [BusinessType.MEDICAL]: ['Medical Center', 'Clinic'],
  [BusinessType.CROSSFIT]: ['Gym', 'Nadi', 'Center'],
  [BusinessType.BODYBUILDING]: ['Gym', 'Iron Gym', 'Nadi'],
  [BusinessType.PILATES]: ['Studio', 'Fitness Center'],
  [BusinessType.FITNESS]: ['Gym', 'Sports Club'],
  [BusinessType.BEAUTY]: ['Salon', 'Coiffeur', 'Beauty Center'],
  [BusinessType.SALON]: ['Coiffeur', 'Salon'],
  [BusinessType.REPAIR]: ['Workshop', 'Maintenance Center', 'Sianna'],
  [BusinessType.CLEANING]: ['Cleaning Co.', 'Service'],
  [BusinessType.CONSULTING]: ['Office', 'Consulting Center'],
  [BusinessType.TOYS]: ['Toy Store', 'Gifts'],
  [BusinessType.HOME]: ['Home Goods', 'Bazaar'],
  [BusinessType.SPORTS]: ['Sports Store', 'Sport'],
  [BusinessType.AUTOMOTIVE]: ['Auto Center', 'Tires & Oils'],
  [BusinessType.EDUCATION]: ['Learning Center', 'Academy'],
  [BusinessType.ENTERTAINMENT]: ['Entertainment', 'Games Arcade'],
  [BusinessType.TRAVEL]: ['Travel Agency', 'Tours Office'],
};

const GENERIC_PREFIX = ['Mahal', 'Center', 'House'];

/** Pick a random Egyptian tripartite full name (first + father + family). */
export function egyptianFullName(): string {
  const isMale = faker.datatype.boolean();
  const first = faker.helpers.arrayElement(isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES);
  const father = faker.helpers.arrayElement(MALE_FIRST_NAMES);
  const family = faker.helpers.arrayElement(FAMILY_NAMES);
  return `${first} ${father} ${family}`;
}

/** Realistic Egyptian mobile number: +20 1[0,1,2,5] + 8 digits. */
export function egyptianPhone(): string {
  const operator = faker.helpers.arrayElement(['0', '1', '2', '5']); // Vodafone / e& / Orange / WE
  const rest = faker.string.numeric(8);
  return `+201${operator}${rest}`;
}

/** A Cairo-style street address ending in a real district. */
export function cairoAddress(): string {
  const building = faker.number.int({ min: 1, max: 240 });
  const street = faker.helpers.arrayElement(CAIRO_STREETS);
  const district = faker.helpers.arrayElement(CAIRO_DISTRICTS);
  return `${building} ${street} St., ${district}, Cairo`;
}

/** Baladi-style storefront name (transliterated Egyptian commercial naming). */
export function egyptianBusinessName(type: BusinessType): string {
  const prefixes = STOREFRONT_PREFIX[type] ?? GENERIC_PREFIX;
  const prefix = faker.helpers.arrayElement(prefixes);
  // Mix common naming styles: blessed word, "El Hag" owner, "Awlad" family, district.
  const tail = faker.helpers.arrayElement([
    faker.helpers.arrayElement(BARAKA_WORDS),
    `El Hag ${faker.helpers.arrayElement(MALE_FIRST_NAMES)}`,
    `Awlad ${faker.helpers.arrayElement(FAMILY_NAMES)}`,
    faker.helpers.arrayElement(CAIRO_DISTRICTS),
  ]);
  return `${prefix} ${tail}`;
}
