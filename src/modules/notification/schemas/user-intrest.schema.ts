import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserInterestDocument = UserInterest & Document;

@Schema({ timestamps: false, collection: 'user_interests' })
export class UserInterest {

    _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  keyword: string;

  @Prop({ required: true, index: true })
  biz_type: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  rawScore: number;

  @Prop({ default: () => new Date() })
  lastUpdated: Date;

  @Prop({ default: () => new Date() })
  lastDecayApplied: Date;

  @Prop({
    type: [{ searchedAt: Date, hour: Number, dayOfWeek: Number }],
    default: [],
  })
  searchHistory: { searchedAt: Date; hour: number; dayOfWeek: number }[];

  @Prop({ type: Number, default: null })
  peakSearchHour: number | null;

  @Prop({ type: Number, default: null })
  peakSearchDay: number | null;

  @Prop({ type: Date, default: null })
  lastConversionAt: Date | null;

  @Prop({ default: 0 })
  conversionCount: number;
}

export const UserInterestSchema = SchemaFactory.createForClass(UserInterest);

UserInterestSchema.index({ userId: 1, biz_type: 1 }, { unique: true });