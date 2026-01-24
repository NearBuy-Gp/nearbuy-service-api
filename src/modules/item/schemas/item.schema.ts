import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ItemType } from '../enums/item-type.enum';
import { BusinessCategory } from 'src/modules/business/enums/business-category.enum';
import { AvailabilitySchema } from './availability.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Item extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: ItemType,
  })
  type: ItemType;

  @Prop({
    enum: BusinessCategory,
    default: BusinessCategory.CLINIC,
  })
  category: BusinessCategory;

  @Prop({ trim: true })
  subcategory?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Number, default: 0 })
  price?: number;

  @Prop({ type: Number, default: null })
  stock?: number;

  @Prop({ type: Number, default: null })
  duration?: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Business',
    required: true,
  })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  availability: AvailabilitySchema;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
ItemSchema.index({ tags: 'text' });
