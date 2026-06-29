import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Business, BusinessSchema } from './schemas/buisness.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ItemType } from '../item/enums/item-type.enum';
import {
  restaurantItemSchema,
  clinicServiceSchema,
  classSessionSchema,
  gymMembershipSchema,
  supermarketProductSchema,
  clothingProductSchema,
  pharmacyProductSchema,
  electronicsProductSchema,
} from '../item/schemas/item-types.schema';
import { Item, ItemSchema } from '../item/schemas/item.schema';

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
          schema.discriminator(ItemType.ELECTRONICS_PRODUCT, electronicsProductSchema);

          return schema;
        },
      },
    ]),
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
