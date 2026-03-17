import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';

@Injectable()
export class SortStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint): Promise<PipelineStage> {
    const sort = blueprint.entities.sort;

    if (sort?.by) {
      const sortField: Record<string, any> = {
        price: 'pricing.fee',
        rate: 'rating.average',
        distance: 'distance',
      };

      const direction = sort.order === 'asc' ? 1 : -1;
      return { $sort: { [sortField[sort.by]]: direction } };
    }

    return { $sort: { final_score: -1 } };
  }
}
