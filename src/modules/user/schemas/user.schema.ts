import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../../../utils/enums/user-role.enum';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: false })
  userName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, required: true, enum: Role, default: Role.USER })
  role: Role;


  @Prop({ type: Number, min: 18, max: 100 })
  age?: number;

   @Prop({ type: String, enum: ['Student','Employee', 'Professional','Parent','Tourist', 'Business Owner', 'Freelancer'] })
  userType?: string;

   @Prop({ type: [String], enum: ['Food', 'Shopping', 'Electronics', 'Fashion', 'Entertainment', 'Sports', 'Services', 'Healthcare'], default: [] })
   interests?: string[];
  @Prop({ type: String, required: false, default: null })
  fcmToken: string | null;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'Business',
    required: true,
    index: true,
  })
  bookmarkedBusinesses: MongooseSchema.Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
