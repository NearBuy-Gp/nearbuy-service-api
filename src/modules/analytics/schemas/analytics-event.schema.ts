import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';


export type AnalyticsEventDocument = AnalyticsEvent & Document;

@Schema({
  timestamps: true,
})
export class AnalyticsEvent {

  @Prop({ required: true })
  eventType: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Item',
    required: false,
  })
  productId?: MongooseSchema.Types.ObjectId;
}

export const AnalyticsEventSchema =
  SchemaFactory.createForClass(AnalyticsEvent);