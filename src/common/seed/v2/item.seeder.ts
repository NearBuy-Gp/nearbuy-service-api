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

function buildAttributes(itemType: ItemType): Record<string, unknown> | undefined {
  switch (itemType) {
    case ItemType.RESTAURANT:
      return {
        menuCategory: faker.helpers.arrayElement(MENU_CATS),
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

  for (const entry of catalog) {
    const attributes = buildAttributes(itemType);
    const category = categories.length > 0 ? faker.helpers.arrayElement(categories) : undefined;
    const price = jitterPrice(entry.price);
    const inStock = faker.datatype.boolean(0.85);

    const set: Record<string, unknown> = {
      description: entry.description,
      price,
      images: [faker.image.url({ width: 800, height: 800 })],
      isAvailable: faker.datatype.boolean(0.9),
      type: itemType,
      is_in_stock: inStock,
      lastRestockedAt: faker.date.recent({ days: 30 }),
      businessName: business.name,
      businessCategory: business.category,
      businessType: business.type,
      location: business.location,
      businessRate: business.rate,
      workingHours: business.workingHours,
    };
    if (category) set.categoryId = category._id;
    if (attributes) set.attributes = attributes;

    const doc = await itemModel.findOneAndUpdate(
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
