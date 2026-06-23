import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AnalyticsEvent, AnalyticsEventSchema } from './schemas/analytics-event.schema';
import { Business, BusinessSchema } from '../business/schemas/buisness.schema'; 
import {Item , ItemSchema } from '../item/schemas/item.schema'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET_KEY') || '',
  signOptions: {
    expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
  },
}),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: User.name, schema: UserSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}