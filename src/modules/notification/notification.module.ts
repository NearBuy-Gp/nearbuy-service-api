import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationDelivery, NotificationDeliverySchema } from './schemas/notifiaction-delivery.schema';
import { NotificationSubscription, NotificationSubscriptionSchema } from './schemas/notification-subscriptions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSubscription.name, schema: NotificationSubscriptionSchema },
      { name: NotificationDelivery.name, schema: NotificationDeliverySchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
