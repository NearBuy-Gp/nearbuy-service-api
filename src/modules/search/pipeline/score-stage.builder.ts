import { Injectable } from '@nestjs/common';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';
import { PipelineStage } from 'mongoose';

@Injectable()
export class ScoreStageBuilder implements IPipelineStageBuilder {
  async build(): Promise<PipelineStage> {
    return {
      $addFields: {
        rating_normalized: { $divide: ['$rate', 5] },

        distance_score: 1.0,

        final_score: {
          $add: [
            { $multiply: [{ $meta: 'vectorSearchScore' }, 0.6] },
            { $multiply: [{ $divide: ['$rating', 5] }, 0.25] },
            { $multiply: [1.0, 0.15] }, // distance placeholder
          ],
        },
      },
    };
  }
}
