/**
 * Deterministic faker-based catalog generator (the `--no-ai` path and the
 * fallback whenever AI output is unusable). Produces realistic-enough business
 * content + item names/descriptions/prices per business type.
 */
import { BusinessType } from '../../../modules/business/enums/business-type.enum';
import { BusinessCategory } from '../../../modules/business/enums/business-category.enum';
import { ItemType } from '../../../modules/item/enums/item-type.enum';
import { faker } from './rng';
import { BusinessContent } from './business.seeder';

export interface CatalogItem {
  name: string;
  description: string;
  price: number;
}

export interface CatalogBundle {
  business: BusinessContent;
  items: CatalogItem[];
}

/** Curated, realistic item-name pools + a sensible base price, keyed by type. */
const ITEM_POOLS: Partial<Record<BusinessType, { names: string[]; price: [number, number] }>> = {
  [BusinessType.ELECTRONICS]: { names: ['iPhone 15 Pro', 'Galaxy S24 Ultra', 'MacBook Air M3', 'Dell XPS 13', 'iPad Air', 'Sony WH-1000XM5', 'AirPods Pro', 'Apple Watch SE', 'Anker Power Bank', 'USB-C Hub'], price: [40, 2500] },
  [BusinessType.CLOTHING]: { names: ['Classic White Shirt', 'Slim Fit Jeans', 'Summer Dress', 'Leather Jacket', 'Wool Sweater', 'Cotton Hoodie', 'Chino Trousers', 'Silk Scarf', 'Denim Skirt', 'Linen Blazer'], price: [25, 350] },
  [BusinessType.SUPERMARKET]: { names: ['Fresh Whole Milk 1L', 'Brown Bread 500g', 'Organic Bananas 1kg', 'Free Range Eggs 12pcs', 'Greek Yogurt 500g', 'Chicken Breast 1kg', 'Basmati Rice 5kg', 'Olive Oil 1L', 'Tomato Paste 400g', 'Cheddar Cheese 250g'], price: [2, 30] },
  [BusinessType.PHARMACY]: { names: ['Vitamin C 1000mg', 'Panadol Extra', 'Omega-3 Fish Oil', 'Multivitamin Complex', 'Calcium + Vit D', 'Hand Sanitizer 100ml', 'Cough Syrup', 'First Aid Kit', 'Eye Drops 15ml', 'Whey Protein 500g'], price: [3, 60] },
  [BusinessType.FAST_FOOD]: { names: ['Classic Beef Burger', 'Crispy Chicken Sandwich', 'Double Cheeseburger', 'Large French Fries', 'Onion Rings', 'Chicken Wings 6pcs', 'Grilled Chicken Wrap', 'Loaded Nachos', 'Chocolate Shake', 'Soft Drink'], price: [3, 18] },
  [BusinessType.CAFE]: { names: ['Espresso', 'Cappuccino', 'Caramel Latte', 'Iced Americano', 'Mocha Frappe', 'Butter Croissant', 'Blueberry Muffin', 'Avocado Toast', 'Cheesecake Slice', 'Matcha Latte'], price: [3, 12] },
  [BusinessType.DESSERT]: { names: ['Vanilla Gelato', 'Chocolate Lava Cake', 'Strawberry Cheesecake', 'Tiramisu', 'Macarons Box 6pcs', 'Ice Cream Sundae', 'Fruit Tart', 'Brownie Sundae', 'Panna Cotta', 'Red Velvet Slice'], price: [5, 20] },
  [BusinessType.SEAFOOD]: { names: ['Grilled Sea Bass', 'Shrimp Linguine', 'Lobster Thermidor', 'Crab Legs 1kg', 'Crispy Calamari', 'Fish & Chips', 'Salmon Teriyaki', 'Seafood Platter', 'Clam Chowder', 'Grilled Octopus'], price: [12, 80] },
  [BusinessType.DENTIST]: { names: ['Dental Checkup', 'Teeth Cleaning', 'Teeth Whitening', 'Composite Filling', 'Root Canal', 'Dental Crown', 'Tooth Extraction', 'Dental Implant', 'Porcelain Veneers', 'Braces Consultation'], price: [40, 1200] },
  [BusinessType.DERMATOLOGY]: { names: ['Skin Consultation', 'Acne Treatment', 'Chemical Peel', 'Laser Hair Removal', 'Mole Removal', 'Botox Session', 'Skin Allergy Test', 'Eczema Treatment', 'Anti-Aging Facial', 'Scar Revision'], price: [50, 600] },
  [BusinessType.PEDIATRIC]: { names: ['Child Wellness Visit', 'Vaccination', 'Newborn Checkup', 'Growth Assessment', 'Fever Consultation', 'Allergy Screening', 'Nutrition Counseling', 'Asthma Review', 'Developmental Screening', 'Ear Examination'], price: [30, 250] },
  [BusinessType.GENERAL_CLINIC]: { names: ['General Consultation', 'Blood Pressure Check', 'Diabetes Screening', 'ECG Test', 'Wound Dressing', 'Annual Physical', 'Flu Shot', 'Cholesterol Test', 'Minor Surgery', 'Health Certificate'], price: [25, 300] },
  [BusinessType.CROSSFIT]: { names: ['WOD Class', 'Olympic Lifting', 'HIIT Session', 'Mobility Class', 'Personal Training', 'Team WOD', 'Kettlebell Session', 'Cardio Bootcamp', 'Gymnastics Skills', 'Endurance Class'], price: [12, 50] },
  [BusinessType.BODYBUILDING]: { names: ['Strength Program', 'Hypertrophy Session', 'Push Day Class', 'Pull Day Class', 'Leg Day Class', 'Personal Coaching', 'Powerlifting Class', 'Nutrition Plan', 'Posing Workshop', 'Recovery Session'], price: [15, 60] },
  [BusinessType.PILATES]: { names: ['Mat Pilates', 'Reformer Pilates', 'Prenatal Pilates', 'Core Strength Class', 'Stretch & Flow', 'Private Session', 'Barre Fusion', 'Rehab Pilates', 'Power Pilates', 'Beginner Pilates'], price: [15, 55] },
  [BusinessType.REPAIR]: { names: ['Phone Screen Repair', 'Laptop Diagnostics', 'AC Maintenance', 'Washing Machine Fix', 'TV Repair', 'Plumbing Call-out', 'Electrical Wiring', 'Fridge Repair', 'Battery Replacement', 'Water Heater Service'], price: [10, 200] },
  [BusinessType.CLEANING]: { names: ['Home Deep Clean', 'Office Cleaning', 'Sofa Shampoo', 'Carpet Cleaning', 'Window Washing', 'Post-Construction Clean', 'Move-out Clean', 'Kitchen Degrease', 'Mattress Cleaning', 'Disinfection Service'], price: [15, 180] },
  [BusinessType.BEAUTY]: { names: ['Haircut & Style', 'Beard Trim', 'Manicure', 'Pedicure', 'Facial Treatment', 'Hair Coloring', 'Makeup Session', 'Waxing', 'Bridal Package', 'Hair Spa'], price: [8, 150] },
  [BusinessType.CONSULTING]: { names: ['Business Strategy Session', 'Tax Advisory', 'Legal Consultation', 'Marketing Audit', 'HR Consultation', 'Financial Planning', 'IT Assessment', 'Startup Mentoring', 'Brand Workshop', 'Compliance Review'], price: [40, 500] },
};

/** Generic fallbacks per item type when a business type has no curated pool. */
function genericItem(itemType: ItemType): CatalogItem {
  const price = faker.number.int({ min: 10, max: 300 });
  switch (itemType) {
    case ItemType.RESTAURANT:
      return { name: faker.food.dish(), description: faker.food.description(), price: faker.number.int({ min: 4, max: 40 }) };
    case ItemType.CLINIC:
      return { name: `${faker.word.adjective()} Consultation`, description: faker.lorem.sentence(), price: faker.number.int({ min: 30, max: 400 }) };
    case ItemType.CLASS_SESSION:
      return { name: `${faker.word.adjective()} Class`, description: faker.lorem.sentence(), price: faker.number.int({ min: 12, max: 60 }) };
    case ItemType.CLOTHING_PRODUCT:
      return { name: faker.commerce.productName(), description: faker.commerce.productDescription(), price: faker.number.int({ min: 20, max: 300 }) };
    case ItemType.PHARMACY_PRODUCT:
      return { name: `${faker.science.chemicalElement().name} Supplement`, description: faker.lorem.sentence(), price: faker.number.int({ min: 3, max: 60 }) };
    case ItemType.SUPER_MARKET_PRODUCT:
      return { name: faker.commerce.productName(), description: faker.commerce.productDescription(), price: faker.number.int({ min: 2, max: 80 }) };
    case ItemType.SERVICE:
    default:
      return { name: `${faker.company.buzzVerb()} ${faker.company.buzzNoun()} service`, description: faker.company.catchPhrase(), price };
  }
}

function businessName(type: BusinessType): string {
  const flavor = faker.helpers.arrayElement([faker.company.name(), `${faker.location.city()} ${faker.company.buzzNoun()}`, `${faker.person.lastName()}'s`]);
  return `${flavor} ${type.replace(/_/g, ' ')}`.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fakerBusinessContent(type: BusinessType, category: BusinessCategory): BusinessContent {
  const keywords = type.split('_');
  return {
    name: businessName(type),
    description: `${faker.company.catchPhrase()}. A trusted ${type.replace(/_/g, ' ')} ${category} offering quality and great service to the local community.`,
    tags: [...keywords, category, faker.commerce.productAdjective().toLowerCase(), faker.word.noun()].map((t) => t.toLowerCase()),
  };
}

export function fakerCatalog(type: BusinessType, itemType: ItemType, count: number): CatalogItem[] {
  const pool = ITEM_POOLS[type];
  const items: CatalogItem[] = [];
  if (pool) {
    const [min, max] = pool.price;
    for (let i = 0; i < count; i++) {
      const name = pool.names[i % pool.names.length];
      items.push({
        name,
        description: `${name} — ${faker.commerce.productDescription()}`,
        price: faker.number.int({ min, max }),
      });
    }
  } else {
    for (let i = 0; i < count; i++) items.push(genericItem(itemType));
  }
  return items;
}

export function fakerBundle(type: BusinessType, category: BusinessCategory, itemType: ItemType, count: number): CatalogBundle {
  return {
    business: fakerBusinessContent(type, category),
    items: fakerCatalog(type, itemType, count),
  };
}
