import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class AttributeStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint): Promise<PipelineStage | null> {
    const { entities } = blueprint;
    const filter: Record<string, any> = {};

    if (entities.size) filter['attributes.sizes'] = { $in: [entities.size.toUpperCase()] };
    if (entities.color) filter['attributes.colorsAvailable'] = { $regex: entities.color, $options: 'i' };
    if (entities.brand) filter['attributes.brand'] = { $regex: entities.brand, $options: 'i' };
    if (entities.membership_duration_months) {
      filter['attributes.validity'] = { $regex: String(entities.membership_duration_months), $options: 'i' };
    }
    // if (entities.quantity) filter['attributes.stock'] = { $gte: entities.quantity };

    return Object.keys(filter).length ? { $match: filter } : null;
  }
}
