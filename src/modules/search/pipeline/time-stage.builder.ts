import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { toTimeString, normalizeTime } from '../utils/time-normalization';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class TimeStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint, search?: SearchRequestDto): Promise<PipelineStage | null> {
    if (search?.openNow) {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const currentTime = toTimeString(now.getHours(), now.getMinutes());
      return this.workingHoursMatch(currentDay, currentTime);
    }

    const tc = blueprint.entities.time_constraints;
    if (!tc) return null;

    if (tc.is_now) {
      const now = new Date();
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const currentTime = toTimeString(now.getHours(), now.getMinutes());
      return this.workingHoursMatch(currentDay, currentTime);
    }

    if (tc.day_of_week && tc.target_time) {
      return this.workingHoursMatch(tc.day_of_week.toLowerCase(), normalizeTime(tc.target_time));
    }

    if (tc.day_of_week) {
      return { $match: { workingHours: { $elemMatch: { day: tc.day_of_week.toLowerCase(), isClosed: false } } } };
    }

    return null;
  }

  private workingHoursMatch(day: string, time: string): PipelineStage {
    // Handles both same-day windows (from <= to) and overnight windows (from > to, e.g. 22:00–02:00).
    // $elemMatch can't run $expr, so we walk workingHours via $anyElementTrue + $map.
    return {
      $match: {
        $expr: {
          $anyElementTrue: {
            $map: {
              input: { $ifNull: ['$workingHours', []] },
              as: 'wh',
              in: {
                $and: [
                  { $eq: ['$$wh.day', day] },
                  { $eq: ['$$wh.isClosed', false] },
                  {
                    $or: [
                      // Same-day window: from <= time <= to
                      {
                        $and: [
                          { $lte: ['$$wh.from', '$$wh.to'] },
                          { $lte: ['$$wh.from', time] },
                          { $gte: ['$$wh.to', time] },
                        ],
                      },
                      // Overnight window: from > to, open if time >= from OR time <= to
                      {
                        $and: [
                          { $gt: ['$$wh.from', '$$wh.to'] },
                          {
                            $or: [
                              { $gte: [time, '$$wh.from'] },
                              { $lte: [time, '$$wh.to'] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    };
  }
}
