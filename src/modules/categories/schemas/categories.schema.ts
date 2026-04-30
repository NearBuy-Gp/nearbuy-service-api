import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ItemType } from '../../item/enums/item-type.enum';

@Schema({
  timestamps: true,
})
export class Category {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true, enum: Object.values(ItemType) })
  itemType: ItemType;
  @Prop({ required: true })
  key: string;
}
export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ key: 1, itemType: 1 }, { unique: true });
CategorySchema.index({ itemType: 1 });
