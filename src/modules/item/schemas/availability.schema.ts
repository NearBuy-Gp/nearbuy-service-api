import { Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class AvailabilitySchema extends Document {
  @Prop({ type: Boolean, default: null })
  isAvailable: boolean;
  @Prop({ type: Boolean, default: false })
  bookingRequired: boolean;
  @Prop({ type: Number, default: null })
  estimatedDuration: number;
  @Prop({ type: Array, default: [] })
  slots: [
    {
      day: { type: string; lowercase: true };
      times: [string];
    },
  ];
}
