/* Seeds the Category reference collection idempotently (upsert by {key,itemType}). */
import { Model } from 'mongoose';
import { Category } from '../../../modules/categories/schemas/categories.schema';
import { ItemType } from '../../../modules/item/enums/item-type.enum';
import { ITEM_CATEGORY_SEED } from '../../../modules/categories/types/item-filter-category.schema';
import { log } from './logger';

export interface CategoryRef {
  _id: any;
  key: string;
  name: string;
  itemType: ItemType;
}

/** Upserts all reference categories and returns them grouped by ItemType. */
export async function seedCategories(categoryModel: Model<Category>, dryRun: boolean): Promise<Map<ItemType, CategoryRef[]>> {
  let upserts = 0;

  if (!dryRun) {
    for (const [itemType, categories] of Object.entries(ITEM_CATEGORY_SEED)) {
      for (const category of categories) {
        await categoryModel.updateOne(
          { key: category.key, itemType },
          { $setOnInsert: { name: category.name, itemType } },
          { upsert: true },
        );
        upserts += 1;
      }
    }
  }

  const byType = new Map<ItemType, CategoryRef[]>();
  if (!dryRun) {
    const docs = await categoryModel.find().lean();
    for (const doc of docs) {
      const it = doc.itemType as ItemType;
      if (!byType.has(it)) byType.set(it, []);
      byType.get(it)!.push({ _id: doc._id, key: doc.key, name: doc.name, itemType: it });
    }
  }

  log.ok(`Reference categories ready (${dryRun ? 'dry-run, skipped' : `${upserts} upserts, ${[...byType.values()].reduce((a, c) => a + c.length, 0)} categories`}).`);
  return byType;
}
