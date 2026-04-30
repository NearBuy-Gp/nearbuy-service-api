import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class PriceRatingStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint, search?: SearchRequestDto): Promise<PipelineStage | null> {
    const { entities } = blueprint;
    const filter: Record<string, any> = {};

    const userRating = search?.ratingMin;
    if (userRating != null) {
      filter.businessRate = { $gte: userRating };
    } else if (entities.rating_min) {
      filter.businessRate = { $gte: entities.rating_min };
    }

    const hasUserPrice = search?.priceMin != null || search?.priceMax != null;
    if (hasUserPrice) {
      const priceMatch: Record<string, number> = {};
      if (search!.priceMin != null) priceMatch.$gte = search!.priceMin;
      if (search!.priceMax != null) priceMatch.$lte = search!.priceMax;
      filter.price = priceMatch;
    } else if (entities.price_filter) {
      const { operator, value, max_value } = entities.price_filter;
      if (operator === 'lt') filter.price = { $lte: value };
      else if (operator === 'gt') filter.price = { $gte: value };
      else if (operator === 'range') filter.price = { $gte: value, $lte: max_value };
    }

    return Object.keys(filter).length ? { $match: filter } : null;
  }
}
