import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class PriceRatingStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint): Promise<PipelineStage | null> {
    const { entities } = blueprint;
    const filter: Record<string, any> = {};

    if (entities.rating_min) {
      filter.businessRate = { $gte: entities.rating_min };
    }

    if (entities.price_filter) {
      const { operator, value, max_value } = entities.price_filter;
      if (operator === 'lt') filter.price = { $lte: value };
      else if (operator === 'gt') filter.price = { $gte: value };
      else if (operator === 'range') filter.price = { $gte: value, $lte: max_value };
    }

    return Object.keys(filter).length ? { $match: filter } : null;
  }
}
