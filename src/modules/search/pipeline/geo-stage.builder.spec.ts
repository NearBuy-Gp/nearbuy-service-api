import { Test, TestingModule } from '@nestjs/testing';
import { GeoStageBuilder } from './geo-stage.builder';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { getCoordinates } from '../utils/geo-get-coordinates';

// Geocoding hits OpenStreetMap Nominatim over the network. Mock it so the unit
// test stays hermetic and deterministic — we assert how the builder *consumes*
// the returned [lng, lat], not the HTTP call itself.
jest.mock('../utils/geo-get-coordinates');
const mockedGetCoordinates = getCoordinates as jest.MockedFunction<typeof getCoordinates>;

const EARTH_RADIUS_KM = 6378.1;

describe('GeoStageBuilder', () => {
  let builder: GeoStageBuilder;

  const blueprint = (entities: Partial<NlpBluePrint['entities']>): NlpBluePrint =>
    ({ entities } as NlpBluePrint);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeoStageBuilder],
    }).compile();

    builder = module.get<GeoStageBuilder>(GeoStageBuilder);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  it('returns null when no coordinate source is available', async () => {
    const stage = await builder.build(blueprint({ near_me: false, locations: [] }), {
      userLocation: [30.0444, 31.2357],
    } as SearchRequestDto);

    expect(stage).toBeNull();
    expect(mockedGetCoordinates).not.toHaveBeenCalled();
  });

  describe('near_me path', () => {
    it('swaps userLocation [lat, lng] -> [lng, lat] and uses the 5km default radius', async () => {
      const stage = await builder.build(blueprint({ near_me: true, locations: [] }), {
        userLocation: [30.0444, 31.2357], // [lat, lng]
      } as SearchRequestDto);

      expect(stage).toEqual({
        $match: {
          location: {
            $geoWithin: { $centerSphere: [[31.2357, 30.0444], 5 / EARTH_RADIUS_KM] },
          },
        },
      });
      // Near-me must never trigger a geocoding network call.
      expect(mockedGetCoordinates).not.toHaveBeenCalled();
    });

    it('respects an explicit distance_km radius', async () => {
      const stage = (await builder.build(blueprint({ near_me: true, locations: [], distance_km: 12 }), {
        userLocation: [30, 31],
      } as SearchRequestDto)) as any;

      expect(stage.$match.location.$geoWithin.$centerSphere[1]).toBeCloseTo(12 / EARTH_RADIUS_KM, 10);
    });
  });

  describe('named-location path', () => {
    it('geocodes the location and defaults the radius to 10km', async () => {
      mockedGetCoordinates.mockResolvedValue([31.5, 30.5]); // [lng, lat]

      const stage = await builder.build(blueprint({ near_me: false, locations: ['Maadi'] }), {
        userLocation: [30.0444, 31.2357],
      } as SearchRequestDto);

      expect(mockedGetCoordinates).toHaveBeenCalledWith('Maadi');
      expect(stage).toEqual({
        $match: {
          location: {
            $geoWithin: { $centerSphere: [[31.5, 30.5], 10 / EARTH_RADIUS_KM] },
          },
        },
      });
    });

    it('prefers a named location over near_me when both are present', async () => {
      mockedGetCoordinates.mockResolvedValue([29.9, 31.2]);

      const stage = (await builder.build(blueprint({ near_me: true, locations: ['Zamalek'] }), {
        userLocation: [10, 20],
      } as SearchRequestDto)) as any;

      expect(mockedGetCoordinates).toHaveBeenCalledWith('Zamalek');
      expect(stage.$match.location.$geoWithin.$centerSphere[0]).toEqual([29.9, 31.2]);
    });
  });
});
