import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusinessCategory } from '../../business/enums/business-category.enum';
import { BusinessType } from '../../business/enums/business-type.enum';

export enum NotificationType {
  RESTOCK = 'RESTOCK',
  BUSINESS_OPEN = 'BUSINESS_OPEN',
  PROXIMITY = 'PROXIMITY',
  BEHAVIORAL = 'BEHAVIORAL',
}

@Schema({ timestamps: true })
export class NotificationSubscription extends Document {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: NotificationType,
    required: true,
  })
  type: NotificationType;

  // Optional for RESTOCK / BUSINESS_OPEN
  @Prop({ type: Types.ObjectId, ref: 'Business', required: false })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Item', required: false })
  itemId: Types.ObjectId;

  // Search Intent (for PROXIMITY / BEHAVIORAL)
  @Prop({
    type: {
      businessType: { type: String, enum: BusinessType },
      businessCategory: { type: String, enum: BusinessCategory },
      searchVector: { type: [Number], default: [] },
      keywords: { type: [String], default: [] },
      original_query: { type: String },
      modifiers: {
        is_cheap: { type: Boolean },
        rating_min: { type: Number },
      },
    },
    required: false,
  })
  searchIntent: {
    businessType: BusinessType;
    businessCategory: BusinessCategory;
    searchVector: number[];
    keywords: string[];
    original_query: string;
    modifiers: {
      //check if we actully need it
      is_cheap: boolean;
      rating_min: number;
    };
  };

  @Prop({ type: Types.ObjectId, ref: 'UserInterest', required: true })
  interestRef: Types.ObjectId;

  // State
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  snoozedUntil: Date;

  @Prop({ required: false })
  lastNotifiedAt: Date;

  @Prop({ default: 0 })
  notifyCount: number;

  // Geofence
  @Prop({
    type: {
      radiusMeters: { type: Number, default: 300 },
    },
    default: { radiusMeters: 300 },
  })
  geofence: {
    radiusMeters: number;
  };

  // TTL
  @Prop({ required: false })
  expiresAt: Date;
}

export const NotificationSubscriptionSchema = SchemaFactory.createForClass(NotificationSubscription);
