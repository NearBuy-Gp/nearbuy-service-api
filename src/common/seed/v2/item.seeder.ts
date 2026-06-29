/**
 * Item (product/service) seeding + semantic embeddings.
 *
 * - Picks a Category whose itemType matches the business's planned itemType.
 * - Builds schema-valid, type-specific `attributes` (valid enum values).
 * - Upserts items by {businessId, name} (idempotent).
 * - Embeddings are produced by the app's EmbedClientService; the request payload
 *   is built here directly (covers SERVICE, which EmbeddingTextBuilder rejects).
 */
import { Model, Types } from 'mongoose';
import { Item } from '../../../modules/item/schemas/item.schema';
import { ItemType } from '../../../modules/item/enums/item-type.enum';
import { RestaurantItemCategory } from '../../../modules/item/enums/resturant-category';
import { SizeEnum } from '../../../modules/item/enums/size.enum';
import { EmbedClientService } from '../../../modules/search/clients/embed-client.service';
import { CatalogItem } from './catalog.faker';
import { BusinessSeed } from './business.seeder';
import { CategoryRef } from './reference.seeder';
import { faker, jitterPrice } from './rng';
import { retry } from './concurrency';

const SIZES = Object.values(SizeEnum);
const MENU_CATS = Object.values(RestaurantItemCategory);

// Keyword → RestaurantItemCategory rules so a restaurant item's menuCategory
// reflects what it actually is (e.g. "Margherita Pizza" → Pizza) instead of a
// random enum value. First match wins; falls back to a random valid category.
const MENU_CATEGORY_RULES: [RegExp, RestaurantItemCategory][] = [
  [/\bpizza\b/i, RestaurantItemCategory.PIZZA],
  [/\bburger/i, RestaurantItemCategory.BURGERS],
  [/shawarma/i, RestaurantItemCategory.SHAWARMA],
  [/sandwich|sub\b|wrap|panini/i, RestaurantItemCategory.SANDWICHES],
  [/fried chicken|wings?|nuggets?|broasted/i, RestaurantItemCategory.FRIED_CHICKEN],
  [/pasta|spaghetti|lasagn|linguine|penne|fettuccine|mac and cheese/i, RestaurantItemCategory.PASTA],
  [/grill|kebab|kofta|bbq|steak|tikka|skewer/i, RestaurantItemCategory.GRILLS],
  [/salad/i, RestaurantItemCategory.SALADS],
  [/fries|appetizer|nachos|onion ring|dip|sides?\b|mozzarella stick|spring roll/i, RestaurantItemCategory.SIDES_AND_APPETIZERS],
  [/cake|dessert|ice ?cream|brownie|tiramisu|cheesecake|gelato|tart|macaron|pudding|panna ?cotta|waffle|crepe|baklava|kunafa/i, RestaurantItemCategory.DESSERTS],
  [/coffee|latte|espresso|cappuccino|\btea\b|juice|shake|smoothie|drink|americano|mocha|frappe|matcha|soda|cola|lemonade|water/i, RestaurantItemCategory.DRINKS],
  [/meal|combo|platter|rice|chicken|beef|fish|seafood|salmon|shrimp|curry|soup/i, RestaurantItemCategory.MEALS],
];

function pickMenuCategory(name: string): RestaurantItemCategory {
  for (const [re, cat] of MENU_CATEGORY_RULES) {
    if (re.test(name)) return cat;
  }
  return faker.helpers.arrayElement(MENU_CATS);
}

/**
 * Map the catalog item's (AI- or faker-assigned) category NAME to a real DB
 * Category for this itemType. Tries exact key/name, then substring, and finally
 * a random valid category so an item is always linked to a type-correct one.
 */
function matchCategory(name: string | undefined, categories: CategoryRef[]): CategoryRef | undefined {
  if (categories.length === 0) return undefined;
  if (name) {
    const n = name.trim().toLowerCase();
    const exact = categories.find((c) => c.name.toLowerCase() === n || c.key.toLowerCase() === n);
    if (exact) return exact;
    const partial = categories.find((c) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()));
    if (partial) return partial;
  }
  return faker.helpers.arrayElement(categories);
}

function buildAttributes(itemType: ItemType, entry: CatalogItem): Record<string, unknown> | undefined {
  switch (itemType) {
    case ItemType.RESTAURANT:
      return {
        menuCategory: pickMenuCategory(entry.name),
        sizes: faker.helpers.arrayElement(SIZES),
        tags: faker.helpers.arrayElements(['popular', 'spicy', 'vegan', 'new', 'chef-special', 'gluten-free'], faker.number.int({ min: 1, max: 3 })),
      };
    case ItemType.CLINIC:
      return {
        doctorName: `Dr. ${faker.person.fullName()}`,
        doctorSpecialization: faker.helpers.arrayElement(['General Practitioner', 'Orthodontist', 'Dermatologist', 'Pediatrician', 'Cardiologist', 'Oral Surgeon']),
        waitingPeriod: `${faker.number.int({ min: 5, max: 40 })} minutes`,
      };
    case ItemType.CLASS_SESSION:
      return {
        trainerName: faker.person.fullName(),
        schedule: faker.helpers.arrayElement(['Mon/Wed/Fri 6:00 AM', 'Tue/Thu 7:00 PM', 'Sat 10:00 AM', 'Daily 5:00 PM']),
        duration: `${faker.number.int({ min: 30, max: 90 })} min`,
        capacity: faker.number.int({ min: 5, max: 25 }),
        intensityLevel: faker.helpers.arrayElement(['low', 'medium', 'high']),
      };
    case ItemType.SUPER_MARKET_PRODUCT:
      return {
        brand: faker.company.name(),
        weight: `${faker.number.int({ min: 100, max: 2000 })}g`,
        stock: faker.number.int({ min: 0, max: 200 }),
      };
    case ItemType.PHARMACY_PRODUCT:
      return {
        brand: faker.company.name(),
        activeIngredients: faker.helpers.arrayElements(['paracetamol', 'ibuprofen', 'vitamin c', 'zinc', 'omega-3', 'calcium'], faker.number.int({ min: 1, max: 3 })),
        dosageForm: faker.helpers.arrayElement(['tablet', 'capsule', 'syrup', 'cream', 'drops']),
        packageSize: `${faker.number.int({ min: 10, max: 100 })} units`,
        stock: faker.number.int({ min: 0, max: 300 }),
      };
    case ItemType.CLOTHING_PRODUCT:
      return {
        sizes: faker.helpers.arrayElements(SIZES, faker.number.int({ min: 1, max: 3 })),
        colorsAvailable: faker.helpers.arrayElements(['black', 'white', 'navy', 'red', 'beige', 'green'], faker.number.int({ min: 2, max: 4 })),
        material: faker.helpers.arrayElement(['Cotton', 'Polyester', 'Wool', 'Linen', 'Denim']),
        brand: faker.company.name(),
        stock: faker.number.int({ min: 0, max: 80 }),
      };
    case ItemType.ELECTRONICS_PRODUCT:
      return {
        brand: faker.helpers.arrayElement(['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Xiaomi']),
        model: faker.commerce.productName(),
        warranty: faker.helpers.arrayElement(['6 months', '1 year', '2 years', '3 years']),
        stock: faker.number.int({ min: 0, max: 120 }),
      };
    case ItemType.SERVICE:
    default:
      return undefined; // SERVICE has no discriminator; base doc only.
  }
}

export interface SeededItem {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  itemType: ItemType;
  attributes?: Record<string, unknown>;
  business: BusinessSeed;
  hasEmbedding: boolean;
}

/** Create/upsert all items for a business; embeddings handled separately. */
export async function createItemsForBusiness(
  itemModel: Model<Item>,
  business: BusinessSeed,
  itemType: ItemType,
  categories: CategoryRef[],
  catalog: CatalogItem[],
): Promise<SeededItem[]> {
  const seeded: SeededItem[] = [];

  // Type-specific `attributes` only exist on the per-type discriminator schemas,
  // NOT on the base Item schema. Writing through the base model silently strips
  // them, so resolve the discriminator model for this itemType and write through
  // it (SERVICE has no discriminator → base model). This is what actually
  // persists menuCategory/doctorName/brand/etc.
  const writeModel = (itemModel.discriminators?.[itemType] as Model<Item> | undefined) ?? itemModel;
  const usesDiscriminator = writeModel !== itemModel;

  for (const entry of catalog) {
    const attributes = buildAttributes(itemType, entry);
    const category = matchCategory(entry.category, categories);
    const price = jitterPrice(entry.price);
    const inStock = faker.datatype.boolean(0.85);

    const set: Record<string, unknown> = {
      description: entry.description,
      price,
      images: [faker.image.url({ width: 800, height: 800 })],
      isAvailable: faker.datatype.boolean(0.9),
      is_in_stock: inStock,
      lastRestockedAt: faker.date.recent({ days: 30 }),
      businessName: business.name,
      businessCategory: business.category,
      businessType: business.type,
      location: business.location,
      businessRate: business.rate,
      workingHours: business.workingHours,
    };
    // The discriminator model sets `type` itself (and rejects $set on the
    // discriminator key); the base model needs it set explicitly.
    if (!usesDiscriminator) set.type = itemType;
    if (category) set.categoryId = category._id;
    if (attributes) set.attributes = attributes;

    const doc = await writeModel.findOneAndUpdate(
      { businessId: business._id, name: entry.name },
      { $set: set, $setOnInsert: { businessId: business._id, name: entry.name } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    seeded.push({
      _id: doc._id as Types.ObjectId,
      name: entry.name,
      description: entry.description,
      price,
      itemType,
      attributes,
      business,
      hasEmbedding: Array.isArray((doc as any).embedding) && (doc as any).embedding.length === 384,
    });
  }

  return seeded;
}

/** Build the NLP /index payload directly (works for every itemType). */
function embeddingPayload(item: SeededItem) {
  const b = item.business;
  // The NLP /index contract types `attributes.sizes` as a string, but the
  // clothing_product schema stores it as an array. Coerce for the embedding
  // request only — the persisted document keeps its schema-valid array.
  const attributes = { ...(item.attributes ?? {}) } as Record<string, unknown>;
  if (Array.isArray(attributes.sizes)) {
    attributes.sizes = (attributes.sizes as unknown[]).join(', ');
  }
  return {
    item_id: item._id.toString(),
    item_type: item.itemType,
    name: item.name,
    description: item.description || undefined,
    price: item.price,
    attributes: attributes as any,
    business: {
      name: b.name,
      category: b.category,
      type: b.type,
      description: b.description || undefined,
      tags: b.tags?.length ? b.tags : undefined,
    },
  };
}

/** Generate + persist an embedding for one item. Returns true on success. */
export async function embedItem(embedClient: EmbedClientService, itemModel: Model<Item>, item: SeededItem, force: boolean): Promise<boolean> {
  if (item.hasEmbedding && !force) return true;
  try {
    const embedding = await retry(() => embedClient.createEmbedding(embeddingPayload(item) as any), 2, 400);
    await itemModel.updateOne({ _id: item._id }, { $set: { embedding } });
    return true;
  } catch {
    return false;
  }
}
