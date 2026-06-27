import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusinessCategory } from '../../business/enums/business-category.enum';
import { BusinessType } from '../../business/enums/business-type.enum';
@Schema({ timestamps: true })
export class UserInterest extends Document {
  _id: Types.ObjectId;

  @Prop({ required: false })
  searchKeyword: string;

  @Prop({
    required: true,
    enum: BusinessType,
    type: String,
  })
  businessType: BusinessType;

  @Prop({
    required: true,
    enum: BusinessCategory,
    type: String,
  })
  businessCategory: BusinessCategory;

  @Prop({ required: false, default: 0 })
  decayScore: number;

  @Prop({
    type: [
      {
        searchedAt: { type: Date },
        hour: { type: Number },
        dayOfWeek: { type: Number },
      },
    ],
    default: [],
  })
  searchHistory: {
    searchedAt: Date;
    hour: number;
    dayOfWeek: number;
  }[];

  @Prop({ required: false })
  peakSearchHour: number;

  @Prop({ required: false })
  peakSearchDay: number;

  @Prop({ required: false })
  lastConversionAt: Date;

  @Prop({ required: false, default: 0 })
  conversionCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: false })
  lastUpdated: Date;

  @Prop({ required: false })
  lastDecayApplied: Date;
}

export const UserInterestSchema = SchemaFactory.createForClass(UserInterest);