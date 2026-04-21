import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema } from '../business/schemas/buisness.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Item, ItemSchema } from './schemas/item.schema';
import { ItemType } from './enums/item-type.enum';
import {
  classSessionSchema,
  clinicServiceSchema,
  clothingProductSchema,
  gymMembershipSchema,
  pharmacyProductSchema,
  restaurantItemSchema,
  supermarketProductSchema,
} from './schemas/item-types.schema';
import { QueueModule } from '../../common/queue/queue.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        return {
          secret: configService.get<string>('JWT_SECRET_KEY') || '',
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: Item.name,
        useFactory: () => {
          const schema = ItemSchema;

          schema.discriminator(ItemType.RESTAURANT, restaurantItemSchema);
          schema.discriminator(ItemType.CLINIC, clinicServiceSchema);
          schema.discriminator(ItemType.CLASS_SESSION, classSessionSchema);
          schema.discriminator(ItemType.MEMBERSHIP, gymMembershipSchema);
          schema.discriminator(ItemType.SUPER_MARKET_PRODUCT, supermarketProductSchema);
          schema.discriminator(ItemType.CLOTHING_PRODUCT, clothingProductSchema);
          schema.discriminator(ItemType.PHARMACY_PRODUCT, pharmacyProductSchema);

          return schema;
        },
      },
    ]),
    QueueModule,
  ],
  providers: [ItemService],
  controllers: [ItemController],
})
export class ItemModule {}
