import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class ProjectionStageBuilder implements IPipelineStageBuilder {
  async build(): Promise<PipelineStage> {
    return {
      $project: {
        _id: 0,
        businessId: '$businessId',
        name: '$businessName',
        category: '$businessCategory',
        rate: '$businessRate',
        photo: { $arrayElemAt: ['$images', 0] },
        isOpenNow: 1,
        distance_km: { $round: ['$distance_km', 2] },
      },
    };
  }
}
