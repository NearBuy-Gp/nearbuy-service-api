import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ItemType } from '../enums/item-type.enum';
import { BusinessCategory } from '../../business/enums/business-category.enum';
import { BusinessType } from '../../business/enums/business-type.enum';
import { WorkingHours } from '../../business/interfaces/working-hours.interface';

@Schema({
  timestamps: true,
  versionKey: false,
  discriminatorKey: 'type',
  collection: 'items',
})
export class Item extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Number, default: 0, required: true })
  price?: number;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Business',
    required: true,
  })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    enum: ItemType,
  })
  type: ItemType;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: MongooseSchema.Types.ObjectId;
  @Prop({ required: true })
  businessName: string;

  @Prop({ type: String, enum: BusinessCategory, required: true })
  businessCategory: BusinessCategory;

  @Prop({ type: String, enum: BusinessType, required: true })
  businessType: BusinessType;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    _id: false,
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  businessRate: number;

  @Prop({ type: [Object], default: [] })
  workingHours: WorkingHours[];

  @Prop({ type: [Number], default: [] })
  embedding: number[];
}

export const ItemSchema = SchemaFactory.createForClass(Item);
ItemSchema.index({ businessId: 1, categoryId: 1 });
ItemSchema.index({ businessId: 1 });
ItemSchema.index({ location: '2dsphere' });
ItemSchema.index({ category: 1, businessType: 1 });
ItemSchema.index({ businessRate: -1 });
ItemSchema.index({ price: 1 });
ItemSchema.index({ businessId: 1, isAvailable: 1 });
ItemSchema.index({ isAvailable: 1 });
