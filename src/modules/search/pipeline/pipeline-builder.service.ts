import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { GeoStageBuilder } from './geo-stage.builder';
import { SortStageBuilder } from './sort-stage.builder';
import { TimeStageBuilder } from './time-stage.builder';
import { ProjectionStageBuilder } from './projection-stage.builder';
import { PriceRatingStageBuilder } from './price-rating-stage.builder';
import { ScoreStageBuilder } from './score-stage.builder';
import { AttributeStageBuilder } from './attribute-stage.builder';

// 1 Vector Search
// 2 Geo search (look at it)
// 3 Parametric Filters (need to be on item level and needs adds on the blueprint)
// 4 Re-ranking
// 5 rank
// Limit + Projection
//consider stock and availability in the filters and ranking
// pipeline-builder.service.ts
@Injectable()
export class PipelineBuilderService {
  constructor(
    private readonly geoStageBuilder: GeoStageBuilder,
    private readonly timeStageBuilder: TimeStageBuilder,
    private readonly priceRatingStageBuilder: PriceRatingStageBuilder,
    private readonly projectionBuilder: ProjectionStageBuilder,
    private readonly scoreStageBuilder: ScoreStageBuilder,
    private readonly attributeStageBuilder: AttributeStageBuilder,
    private readonly sortStageBuilder: SortStageBuilder,
  ) {}

  async build(blueprint: NlpBluePrint, search: SearchRequestDto): Promise<PipelineStage[]> {
    const pipeline: PipelineStage[] = [];
    console.log(blueprint);

    if (blueprint.intent === 'OUT_OF_SCOPE') {
      pipeline.push({ $limit: 15 });
      pipeline.push(await this.projectionBuilder.build());
      return pipeline;
    }
    pipeline.push(this.buildVectorSearch(blueprint));
    pipeline.push({ $addFields: { vectorScore: { $meta: 'vectorSearchScore' } } });

    const geoStage = await this.geoStageBuilder.build(blueprint, search);
    if (geoStage) pipeline.push(geoStage);

    const timeStage = await this.timeStageBuilder.build(blueprint);
    if (timeStage) pipeline.push(timeStage);

    const priceRatingStage = await this.priceRatingStageBuilder.build(blueprint, search);
    if (priceRatingStage) pipeline.push(priceRatingStage);

    const attributeStage = await this.attributeStageBuilder.build(blueprint);
    if (attributeStage) pipeline.push(attributeStage);

    pipeline.push(await this.scoreStageBuilder.build());
    pipeline.push(await this.sortStageBuilder.build(blueprint));
    pipeline.push({ $limit: 15 });
    pipeline.push(await this.projectionBuilder.build());
    return pipeline;
  }
  private buildVectorSearch(blueprint: NlpBluePrint): PipelineStage {
    const { business_type, urgency, modifiers } = blueprint.entities;

    // const preFilter: Record<string, any> = { isAvailable: true };
    const preFilter: Record<string, any> = {};
    if (business_type) preFilter.businessType = business_type.toLowerCase();
    const numCandidates = urgency ? 50 : modifiers?.is_top_rated ? 300 : 150;
    return {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: blueprint.query_vector,
        numCandidates,
        limit: 50,
        filter: preFilter,
      },
    } as any;
  }
}
