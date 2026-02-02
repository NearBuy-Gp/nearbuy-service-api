import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from 'src/app.module';
import { Category } from 'src/modules/categories/schemas/categories.schema';
import { ITEM_CATEGORY_SEED } from 'src/modules/categories/types/item-filter-category.schema';

async function seedCategories() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  for (const [itemType, categories] of Object.entries(ITEM_CATEGORY_SEED)) {
    for (const category of categories) {
      await categoryModel.updateOne({ key: category.key, itemType }, { $setOnInsert: { name: category.name, itemType } }, { upsert: true });
    }
  }
}
async function runSeeder() {
  await seedCategories();
  console.log('Item categories seeded successfully!');
  process.exit(0);
}

runSeeder();
