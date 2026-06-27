import { Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { getCoordinates } from '../utils/geo-get-coordinates';
import { IPipelineStageBuilder } from './pipeline-stage-builder.interface';

@Injectable()
export class GeoStageBuilder implements IPipelineStageBuilder {
  async build(blueprint: NlpBluePrint, search: SearchRequestDto): Promise<PipelineStage | null> {
    const { entities } = blueprint;
    let coords: [number, number] | null = null;

    // Treat a missing/zero/negative distance as "unspecified" so we fall back to a
    // sane default radius instead of a 0 km circle that matches nothing.
    const requestedKm = Number(entities.distance_km);
    const hasExplicitRadius = Number.isFinite(requestedKm) && requestedKm > 0;
    let radiusKm = hasExplicitRadius ? requestedKm : 10;

    // MongoDB geo queries expect [lng, lat]. Both branches below MUST end with that order.
    if (entities.locations?.length > 0) {
      // getCoordinates() already returns [lng, lat] — keep this order.
      const [lng, lat] = await getCoordinates(entities.locations[0]);
      coords = [Number(lng), Number(lat)];
    } else if (entities.near_me && search.userLocation?.length === 2) {
      // DTO contract: userLocation is [latitude, longitude]. Swap to [lng, lat] for Mongo.
      const [lat, lng] = search.userLocation;
      coords = [Number(lng), Number(lat)];
    }

    if (!coords) return null;

    return {
      $match: {
        location: {
          $geoWithin: { $centerSphere: [coords, radiusKm / 6378.1] },
        },
      },
    };
  }
}
