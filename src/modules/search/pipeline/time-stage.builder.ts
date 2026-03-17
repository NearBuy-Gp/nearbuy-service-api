import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { toTimeString, normalizeTime } from '../utils/time-normalization';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class TimeStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint): Promise<PipelineStage | null> {
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
    return {
      $match: {
        workingHours: { $elemMatch: { day, isClosed: false, from: { $lte: time }, to: { $gte: time } } },
      },
    };
  }
}
