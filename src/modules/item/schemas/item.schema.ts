import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ItemType } from '../enums/item-type.enum';

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
    index: true,
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
    index: true,
    required: true,
  })
  categoryId: MongooseSchema.Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
