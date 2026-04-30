import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class ProjectionStageBuilder implements IPipelineStageBuilder {
  async build(): Promise<PipelineStage> {
    return {
      $project: {
        _id: 1,
        name: 1,
        category: 1,
        businessType: 1,
        businessName: 1,
        'location.coordinates': 1,
        businessRate: 1,
        price: 1,
        isAvailable: 1,
        isOpenNow: 1,
        images: 1,
        address: 1,
        final_score: 1,
        vectorSearchScore: '$vectorScore',
      },
    };
  }
}
