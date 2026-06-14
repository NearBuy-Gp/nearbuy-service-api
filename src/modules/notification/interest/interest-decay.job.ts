import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserInterest, UserInterestDocument } from '../schemas/user-intrest.schema';
import {NotificationSubscription,NotificationSubscriptionDocument} from '../schemas/notification-subscriptions.schema';

const LAMBDA = 0.015;
const DEACTIVATE_THRESHOLD = 0.5;

@Injectable()
export class InterestDecayJob {
  private readonly logger = new Logger(InterestDecayJob.name);

  constructor(
    @InjectModel(UserInterest.name)
    private readonly interestModel: Model<UserInterestDocument>,
    @InjectModel(NotificationSubscription.name)
    private readonly subscriptionModel: Model<NotificationSubscriptionDocument>,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async applyDecayToAll(): Promise<void> {
    this.logger.log('Running weekly interest decay job');
    const now = new Date();

    const interests = await this.interestModel.find({
      score: { $gt: DEACTIVATE_THRESHOLD },
    });

    for (const interest of interests) {
      const daysSince =
        (now.getTime() - interest.lastDecayApplied.getTime()) / 86_400_000;
      const decayedScore =
        interest.score * Math.exp(-LAMBDA * daysSince);

      if (decayedScore < DEACTIVATE_THRESHOLD) {
        await this.subscriptionModel.updateMany(
          { interestRef: interest._id },
          { isActive: false },
        );
      }

      await interest.updateOne({
        score: Math.max(decayedScore, 0),
        lastDecayApplied: now,
      });
    }

    this.logger.log(`Decay applied to ${interests.length} interest documents`);
  }
}