import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../item/schemas/item.schema';
import { Category, CategorySchema } from './schemas/categories.schema';
import { Business, BusinessSchema } from '../business/schemas/buisness.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Item.name, schema: ItemSchema },
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
