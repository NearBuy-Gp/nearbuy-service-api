import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';

@Injectable()
export class SortStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint): Promise<PipelineStage> {
    const sort = blueprint.entities.sort;

    if (sort?.by) {
      const sortField: Record<string, string> = {
        price: 'price',
        rating: 'businessRate',
        distance: 'distance',
        popularity: 'final_score',
      };

      const field = sortField[sort.by];
      if (field) {
        const direction = sort.order === 'asc' ? 1 : -1;
        return { $sort: { [field]: direction } };
      }
    }

    return { $sort: { final_score: -1 } };
  }
}
