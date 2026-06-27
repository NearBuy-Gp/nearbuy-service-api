import { Injectable } from '@nestjs/common';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';
import { PipelineStage } from 'mongoose';

@Injectable()
export class ScoreStageBuilder implements IPipelineStageBuilder {
  async build(): Promise<PipelineStage> {
    // Inverse-distance decay: 1 / (1 + distance_km). Yields 1.0 at the user's
    // location and decays smoothly toward 0 as distance grows, so proximity
    // genuinely discriminates ranking within the 15% weight.
    // `distance_km` is produced by the upstream enrichment $addFields stage;
    // a missing/null value (e.g. item without coordinates) falls back to a
    // large distance so it cannot spuriously inflate the score or null out the
    // entire $add expression.
    const distanceDecay = {
      $divide: [1, { $add: [1, { $ifNull: ['$distance_km', 9999] }] }],
    };

    return {
      $addFields: {
        rating_normalized: { $divide: [{ $ifNull: ['$businessRate', 0] }, 5] },

        distance_score: distanceDecay,

        final_score: {
          $add: [
            { $multiply: [{ $ifNull: ['$vectorScore', 0] }, 0.6] },
            { $multiply: [{ $divide: [{ $ifNull: ['$businessRate', 0] }, 5] }, 0.25] },
            { $multiply: [distanceDecay, 0.15] },
          ],
        },
      },
    };
  }
}
