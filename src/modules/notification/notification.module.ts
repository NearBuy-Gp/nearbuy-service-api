import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProcessor } from './notification.processor';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationDelivery, NotificationDeliverySchema } from './schemas/notifiaction-delivery.schema';
import { NotificationSubscription, NotificationSubscriptionSchema } from './schemas/notification-subscriptions.schema';
import { UserModule } from '../user/user.module';
import { InterestModule } from './interest/interest.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { InterestDecayJob } from './interest/interest-decay.job';
import { FirebaseModule } from '../firebase/firebase/firebase.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: NotificationSubscription.name, schema: NotificationSubscriptionSchema },
      { name: NotificationDelivery.name, schema: NotificationDeliverySchema },
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
