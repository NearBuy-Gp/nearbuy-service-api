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

  @Prop({ required: true, enum: Role, default: Role.USER })
  role: Role;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'Business',
    required: true,
    index: true,
  })
  bookmarkedBusinesses: MongooseSchema.Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
