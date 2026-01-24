import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { BusinessType } from '../enums/business-type.enum';
import { BusinessCategory } from '../enums/business-category.enum';
import { BusinessFacility } from '../enums/business-facilities.enum';
import { BusinessMainItem } from '../enums/business-mainitems.enum';
import { BusinessStatus } from '../enums/business-status.enum';
import { WorkingHours } from '../interfaces/working-hours.interface';
import { BusinessTargetAudience } from '../enums/business-target-audience';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Business extends Document {
  _id: Types.ObjectId;
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({
    required: true,
    enum: BusinessType,
  })
  type: BusinessType;

  @Prop({
    required: false,
    enum: BusinessCategory,
  })
  category?: BusinessCategory;

  @Prop({ required: false })
  subcategory?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  website?: string;

  @Prop()
  whatsappNumber?: string;

  @Prop({
    type: {
      facebook: { type: String },
      instagram: { type: String },
      tiktok: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
    },
    default: {},
  })
  social?: Record<string, string>;

  @Prop({ required: true })
  address: string;

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

  @Prop({
    type: [Object],
    default: [],
  })
  workingHours?: WorkingHours[];

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({
    type: String,
    enum: BusinessStatus,
    default: BusinessStatus.OPEN,
  })
  status: BusinessStatus;

  @Prop({ type: Number, default: 0 })
  rate: number;

  @Prop({
    type: [String],
    enum: BusinessTargetAudience,
    default: [BusinessTargetAudience.FAMILY],
  })
  targetAudience?: BusinessTargetAudience[];

  @Prop({
    type: [String],
    enum: BusinessMainItem,
    default: [],
  })
  mainItems?: BusinessMainItem[];

  @Prop({
    type: [String],
    enum: BusinessFacility,
    default: [],
  })
  facilities?: BusinessFacility[];

  @Prop({
    type: [String],
    default: [],
  })
  targetAudienceOther?: string[];

  @Prop({
    type: [String],
    default: [],
  })
  mainItemsOthers?: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  ownerId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
BusinessSchema.index({ location: '2dsphere' }, { sparse: true });
