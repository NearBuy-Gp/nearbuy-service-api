import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { getCoordinates } from '../utils/geo-get-coordinates';

// 1 Vector Search
// 2 Geo search (look at it)
// 3 Parametric Filters (need to be on item level and needs adds on the blueprint)
// 4 Re-ranking
// 5 rank
// Limit + Projection

@Injectable()
export class PipelineBuilderService {
  constructor() {}
  public async build(blueprint: NlpBluePrint, queryVector: number[], search: SearchRequestDto): Promise<PipelineStage[]> {
    const pipeline: PipelineStage[] = [];

    //Step 2: Geo Search:
    // Case 1: If blueprint.locations is not empty has [lat,lng]
    // Case 2: If blueprint.near_me is true, get user location and use that for geo search
    const geoFilter = await this.buildGeoFilter(blueprint, search);
    if (geoFilter) {
      pipeline.push(geoFilter);
    }
    const parametricFilter = this.buildParametricFilter(blueprint);
    if (parametricFilter) pipeline.push({ $match: parametricFilter });
    return pipeline;
  }
  private async buildGeoFilter(blueprint: NlpBluePrint, search: SearchRequestDto): Promise<PipelineStage.Match | null> {
    const entities = blueprint.entities;
    let geoFilter: PipelineStage.Match = {
      $match: {},
    };
    if (entities.locations && entities.locations.length > 0) {
      // Change it to google maps Api
      // Handle the array when available
      const [lng, lat] = await getCoordinates(entities.locations[0]);
      geoFilter = {
        $match: {
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [Number(lng), Number(lat)],
              },
              $maxDistance: 10000,
            },
          },
        },
      };
    } else if (entities.near_me || !entities.locations) {
      geoFilter = {
        $match: {
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [Number(search.userLocation[1]), Number(search.userLocation[0])],
              },
              $maxDistance: 5000,
            },
          },
        },
      };
    }
    return geoFilter ?? null;
  }
  private buildParametricFilter(blueprint: NlpBluePrint): Record<string, any> {
    const entities = blueprint.entities;
    const filter: Record<string, any> = {};
    // if (entities.time_constraints) {
    //   const now = new Date();
    //   if (entities.time_constraints.is_now) {
    //     filter.opening_hours = { $elemMatch: { day: now.getDay(), open: { $lte: now.toTimeString().slice(0, 5) }, close: { $gte: now.toTimeString().slice(0, 5) } } };
    //   } else if (entities.time_constraints.target_time) {
    //     const targetTime = new Date(entities.time_constraints.target_time);
    //     filter.opening_hours = {
    //       $elemMatch: { day: entities.time_constraints.day_of_week, open: { $lte: targetTime.toTimeString().slice(0, 5) }, close: { $gte: targetTime.toTimeString().slice(0, 5) } },
    //     };
    //   }
    // }
    // if (entities.rating_min) filter.rating = { $gte: entities.rating_min };
    if (entities.price_filter) {
      filter['price'] = {
        $lte: entities.price_filter.max_value ?? Number.MAX_SAFE_INTEGER,
        $eq: entities.price_filter.value ?? undefined,
      };
    }
    if (entities.size) {
      filter['attributes.sizes'] = { $in: [entities.size.toUpperCase()] };
    }
    if (entities.color) {
      filter['attributes.colorsAvailable'] = {
        $regex: entities.color,
        $options: 'i',
      };
    }
    if (entities.membership_duration_months) {
      filter['attributes.validity'] = { $regex: String(entities.membership_duration_months), $options: 'i' };
    }
    if (entities.brand) {
      filter['attributes.brand'] = { $regex: entities.brand, $options: 'i' };
    }
    return filter;
  }
  private buildProjection() {
    return {
      $project: {
        _id: 1,
        name: 1,
        category: 1,
        business_type: 1,
        'location.coordinates': 1,
        'rating.average': 1,
        'pricing.fee': 1,
        'pricing.tier': 1,
        'hours.is_open_now': 1,
        'hours.is_24_hours': 1,
        thumbnail: 1,
        address: 1,
        final_score: 1,
        vectorSearchScore: { $meta: 'vectorSearchScore' },
      },
    };
  }
}
