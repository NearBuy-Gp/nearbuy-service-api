import { Module } from '@nestjs/common';
import { EventListenerService } from './event-listener.service';
import { QueueModule } from '../../../../common/queue/queue.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema } from '../../../business/schemas/buisness.schema';
import { UserSchema } from '../../../user/schemas/user.schema';
import { Item, ItemSchema } from '../../../item/schemas/item.schema';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  providers: [EventListenerService],
})
export class EventListenerModule {}
