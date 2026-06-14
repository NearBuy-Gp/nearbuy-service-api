import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { UserInterest, UserInterestSchema } from '../schemas/user-intrest.schema';
import { IntelligenceService } from './intelligence.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserInterest.name, schema: UserInterestSchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}