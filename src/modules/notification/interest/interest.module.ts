import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserInterest, UserInterestSchema } from '../schemas/user-intrest.schema';
import { InterestService } from './interest.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserInterest.name, schema: UserInterestSchema },
    ]),
  ],
  providers: [InterestService],
  exports: [InterestService, MongooseModule],
})
export class InterestModule {}