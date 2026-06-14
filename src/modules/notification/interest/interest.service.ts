import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserInterest, UserInterestDocument } from '../schemas/user-intrest.schema';

export const SCORE_WEIGHTS = {
  SEARCH:            1,
  VIEW_STORE:        1,
  CLICK_ITEM:        2,
  FAVORITE:          3,
  ADD_WATCHLIST:     5,
  NOTIFICATION_SENT: -1,
  NOTIF_DISMISSED:   -0.5,
} as const;

export type ScoreAction = keyof typeof SCORE_WEIGHTS;

export interface RecordContext {
  keyword: string;
  biz_type: string;
  category: string;
  hour?: number;
  dayOfWeek?: number;
}

@Injectable()
export class InterestService {
  constructor(
    @InjectModel(UserInterest.name)
    private readonly interestModel: Model<UserInterestDocument>,
  ) {}

  async record(
    userId: string,
    action: ScoreAction,
    context: RecordContext,
  ): Promise<void> {
    const delta = SCORE_WEIGHTS[action];
    const now = new Date();

    const searchPush =
      action === 'SEARCH'
        ? {
            $push: {
              searchHistory: {
                $each: [
                  {
                    searchedAt: now,
                    hour: context.hour ?? now.getHours(),
                    dayOfWeek: context.dayOfWeek ?? now.getDay(),
                  },
                ],
                $slice: -50,
              },
            },
          }
        : {};

    await this.interestModel.findOneAndUpdate(
      { userId, biz_type: context.biz_type },
      {
        $inc: { score: delta, rawScore: Math.max(delta, 0) },
        $set: {
          keyword: context.keyword,
          category: context.category,
          lastUpdated: now,
        },
        ...searchPush,
      },
      { upsert: true, new: true },
    );
  }

  async findOne(userId: string, biz_type: string): Promise<UserInterestDocument | null> {
    return this.interestModel.findOne({ userId, biz_type });
  }

  async findById(id: string): Promise<UserInterestDocument | null> {
    return this.interestModel.findById(id);
  }

  async markConverted(userId: string, biz_type: string): Promise<void> {
    await this.interestModel.findOneAndUpdate(
      { userId, biz_type },
      { $set: { lastConversionAt: new Date() }, $inc: { conversionCount: 1 } },
    );
  }
}