import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDeliveryDocument = NotificationDelivery & Document;

@Schema()
export class NotificationDelivery {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NotificationSubscription', required: false })
  subscriptionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Types.ObjectId, required: false })
  businessId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false })
  itemId?: Types.ObjectId;

  @Prop({ default: Date.now })
  triggeredAt: Date;

  @Prop({ enum: ['FCM', 'LOCAL'], default: 'FCM' })
  channel: string;

  @Prop({
    enum: ['SENT', 'FAILED', 'READ', 'DISMISSED'],
    default: 'SENT',
  })
  status: string;

  @Prop({ default: 0 })
  scoreAtSend: number;
}

export const NotificationDeliverySchema = SchemaFactory.createForClass(NotificationDelivery);

// TTL index (60 days = 5184000 seconds)
NotificationDeliverySchema.index({ triggeredAt: 1 }, { expireAfterSeconds: 5184000 });
NotificationDeliverySchema.index({ userId: 1, triggeredAt: -1 });
