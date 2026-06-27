import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProcessor } from './notification.processor';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { NotificationDelivery, NotificationDeliverySchema } from './schemas/notifiaction-delivery.schema';
import { NotificationSubscription, NotificationSubscriptionSchema } from './schemas/notification-subscriptions.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { UserModule } from '../user/user.module';
import { InterestModule } from './interest/interest.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { InterestDecayJob } from './interest/interest-decay.job';
import { FirebaseModule } from '../firebase/firebase/firebase.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
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
      { name: NotificationSubscription.name, schema: NotificationSubscriptionSchema },
      { name: NotificationDelivery.name, schema: NotificationDeliverySchema },
      { name: User.name, schema: UserSchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
    InterestModule,
    IntelligenceModule,
    UserModule,
    FirebaseModule
  ],
  providers: [
    NotificationService,
    NotificationProcessor,
    InterestDecayJob,
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
