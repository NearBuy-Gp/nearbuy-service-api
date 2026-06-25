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
      pipeline.push(this.buildEnrichmentStage(search));
      pipeline.push(await this.projectionBuilder.build());
      return pipeline;
    }
    pipeline.push(this.buildVectorSearch(blueprint));
    pipeline.push({ $addFields: { vectorScore: { $meta: 'vectorSearchScore' } } });

    const geoStage = await this.geoStageBuilder.build(blueprint, search);
    if (geoStage) pipeline.push(geoStage);

    pipeline.push(this.buildEnrichmentStage(search));

    const timeStage = await this.timeStageBuilder.build(blueprint, search);
    if (timeStage) pipeline.push(timeStage);

    const priceRatingStage = await this.priceRatingStageBuilder.build(blueprint, search);
    if (priceRatingStage) pipeline.push(priceRatingStage);

    const attributeStage = await this.attributeStageBuilder.build(blueprint);
    if (attributeStage) pipeline.push(attributeStage);

    pipeline.push(await this.scoreStageBuilder.build());
    pipeline.push(await this.sortStageBuilder.build(blueprint, search));
    pipeline.push({ $limit: 15 });
    pipeline.push(await this.projectionBuilder.build());
    return pipeline;
  }

  // Adds `distance_km` (haversine vs userLocation) and `isOpenNow` (computed from workingHours).
  private buildEnrichmentStage(search: SearchRequestDto): PipelineStage {
    const [userLat, userLng] = search.userLocation;

    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return {
      $addFields: {
        distance_km: {
          $let: {
            vars: {
              lat1: { $degreesToRadians: userLat },
              lat2: { $degreesToRadians: { $arrayElemAt: ['$location.coordinates', 1] } },
              dLat: { $degreesToRadians: { $subtract: [{ $arrayElemAt: ['$location.coordinates', 1] }, userLat] } },
              dLng: { $degreesToRadians: { $subtract: [{ $arrayElemAt: ['$location.coordinates', 0] }, userLng] } },
            },
            in: {
              $multiply: [
                2,
                6378.1,
                {
                  $asin: {
                    $sqrt: {
                      $add: [
                        { $pow: [{ $sin: { $divide: ['$$dLat', 2] } }, 2] },
                        {
                          $multiply: [
                            { $cos: '$$lat1' },
                            { $cos: '$$lat2' },
                            { $pow: [{ $sin: { $divide: ['$$dLng', 2] } }, 2] },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        isOpenNow: {
          $anyElementTrue: {
            $map: {
              input: { $ifNull: ['$workingHours', []] },
              as: 'wh',
              in: {
                $and: [
                  { $eq: ['$$wh.day', currentDay] },
                  { $eq: ['$$wh.isClosed', false] },
                  {
                    $or: [
                      {
                        $and: [
                          { $lte: ['$$wh.from', '$$wh.to'] },
                          { $lte: ['$$wh.from', currentTime] },
                          { $gte: ['$$wh.to', currentTime] },
                        ],
                      },
                      {
                        $and: [
                          { $gt: ['$$wh.from', '$$wh.to'] },
                          {
                            $or: [
                              { $gte: [currentTime, '$$wh.from'] },
                              { $lte: [currentTime, '$$wh.to'] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    };
  }
  private buildVectorSearch(blueprint: NlpBluePrint): PipelineStage {
    const { business_type, urgency, modifiers } = blueprint.entities;

    // const preFilter: Record<string, any> = { isAvailable: true };
    const preFilter: Record<string, any> = {};
    if (business_type) preFilter.businessType = business_type.toLowerCase();

    // $vectorSearch MUST be the first stage and returns a fixed top-K ranked by
    // embedding similarity ALONE — it has no knowledge of the geo/time/price filters
    // that run after it. Those downstream $match stages can decimate a small candidate
    // set down to zero (e.g. "near me" filtering 50 global matches to a 10km circle).
    // Overfetch here so the post-filters have enough survivors; the final $limit: 15
    // caps the response regardless, so a larger limit only costs compute, not result size.
    const limit = 200;
    const numCandidates = Math.max(limit, urgency ? 300 : modifiers?.is_top_rated ? 600 : 400);
    return {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: blueprint.query_vector,
        numCandidates,
        limit,
        filter: preFilter,
      },
    } as any;
  }
}
