import { Test, TestingModule } from '@nestjs/testing';
import { PipelineBuilderService } from './pipeline-builder.service';
import { GeoStageBuilder } from './geo-stage.builder';
import { TimeStageBuilder } from './time-stage.builder';
import { PriceRatingStageBuilder } from './price-rating-stage.builder';
import { ProjectionStageBuilder } from './projection-stage.builder';
import { ScoreStageBuilder } from './score-stage.builder';
import { AttributeStageBuilder } from './attribute-stage.builder';
import { SortStageBuilder } from './sort-stage.builder';
import { NlpBluePrint, Intent } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';

// Defensive: ensure no test can hit OpenStreetMap even if it exercises a named
// location. The orchestrator tests below drive geo through the near_me path,
// which never geocodes, but mocking keeps the suite fully hermetic.
jest.mock('../utils/geo-get-coordinates', () => ({
  getCoordinates: jest.fn().mockResolvedValue([31.2357, 30.0444]),
}));

/**
 * Structural unit tests for the PipelineBuilderService orchestrator.
 *
 * Strategy: wire the REAL stage builders (they are pure, deterministic factories
 * with no DB/I/O) so the assembled array reflects production behaviour, then
 * assert the stage ORDER and the inline $vectorSearch recall sizing. This is the
 * key place the "filter-driven starvation" fix (dynamic numCandidates/limit) is
 * verified end-to-end across the builder.
 */
describe('PipelineBuilderService', () => {
  let service: PipelineBuilderService;

  // A fully-populated, neutral blueprint. Individual tests override `intent`
  // and the specific `entities.*` they care about.
  const makeBlueprint = (overrides: Partial<NlpBluePrint['entities']> = {}, intent: Intent = 'FIND_PRODUCT'): NlpBluePrint =>
    ({
      text: 'pizza',
      intent,
      confidence: 0.9,
      entities: {
        category: undefined as any,
        business_type: undefined as any,
        brand: undefined as any,
        quantity: undefined as any,
        locations: [],
        near_me: false,
        distance_km: undefined as any,
        price_filter: undefined as any,
        rating_min: null,
        sort: undefined as any,
        service_mode: null,
        membership_duration_months: null,
        time_constraints: null as any,
        urgency: false,
        is_24_hours: false,
        size: null,
        color: null,
        attributes: [],
        modifiers: { is_top_rated: false, is_cheap: false, is_luxury: false },
        ...overrides,
      },
      query_vector: [0.1, 0.2, 0.3],
      search_vector_query: 'pizza',
    }) as unknown as NlpBluePrint;

  const baseDto = (overrides: Partial<SearchRequestDto> = {}): SearchRequestDto =>
    ({ query: 'pizza', userLocation: [30.0444, 31.2357], ...overrides }) as SearchRequestDto;

  const vectorSearchOf = (pipeline: any[]) =>
    pipeline.find((s) => s && typeof s === 'object' && '$vectorSearch' in s)?.$vectorSearch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineBuilderService,
        GeoStageBuilder,
        TimeStageBuilder,
        PriceRatingStageBuilder,
        ProjectionStageBuilder,
        ScoreStageBuilder,
        AttributeStageBuilder,
        SortStageBuilder,
      ],
    }).compile();

    service = module.get<PipelineBuilderService>(PipelineBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('OUT_OF_SCOPE intent', () => {
    it('builds the simplified [ $limit, enrichment, projection ] pipeline', async () => {
      const pipeline = await service.build(makeBlueprint({}, 'OUT_OF_SCOPE'), baseDto());

      expect(pipeline).toHaveLength(3);
      expect(pipeline[0]).toEqual({ $limit: 15 });
      expect(pipeline[1]).toHaveProperty('$addFields.distance_km'); // enrichment
      expect(pipeline[1]).toHaveProperty('$addFields.isOpenNow');
      expect(pipeline[2]).toHaveProperty('$project');
      // No vector search / scoring / sorting in the out-of-scope path.
      expect(vectorSearchOf(pipeline as any[])).toBeUndefined();
    });
  });

  describe('IN_SCOPE assembly order', () => {
    it('omits optional filter stages when nothing is requested', async () => {
      const pipeline = (await service.build(makeBlueprint(), baseDto())) as any[];

      // $vectorSearch -> $addFields(vectorScore) -> enrichment -> score -> sort -> $limit -> projection
      expect(pipeline).toHaveLength(7);
      expect(pipeline[0]).toHaveProperty('$vectorSearch');
      expect(pipeline[1]).toEqual({ $addFields: { vectorScore: { $meta: 'vectorSearchScore' } } });
      expect(pipeline[2]).toHaveProperty('$addFields.distance_km'); // enrichment
      expect(pipeline[3]).toHaveProperty('$addFields.final_score'); // score
      expect(pipeline[4]).toHaveProperty('$sort');
      expect(pipeline[5]).toEqual({ $limit: 15 });
      expect(pipeline[6]).toHaveProperty('$project');
    });

    it('inserts geo/time/price/attribute $match stages in the documented order', async () => {
      const blueprint = makeBlueprint({
        near_me: true,
        price_filter: { operator: 'lt', value: 100, max_value: null, currency: 'EGP' },
        size: 'XL',
      });
      const pipeline = (await service.build(blueprint, baseDto({ openNow: true }))) as any[];

      const stageKeys = pipeline.map((s) => Object.keys(s)[0]);
      expect(stageKeys).toEqual([
        '$vectorSearch',
        '$addFields', // vectorScore
        '$match', // geo
        '$addFields', // enrichment
        '$match', // time
        '$match', // price
        '$match', // attribute
        '$addFields', // score
        '$sort',
        '$limit',
        '$project',
      ]);
    });

    it('reuses the precomputed isOpenNow field for the time filter (no $expr re-walk)', async () => {
      const pipeline = (await service.build(makeBlueprint(), baseDto({ openNow: true }))) as any[];

      // The enrichment stage computes isOpenNow; the time $match simply reads it.
      const timeMatch = pipeline.find((s) => s.$match && s.$match.isOpenNow !== undefined);
      expect(timeMatch).toEqual({ $match: { isOpenNow: true } });
    });
  });

  describe('$vectorSearch recall sizing (filter-starvation fix)', () => {
    it('uses the default recall (150 / 50) when fewer than two filters are active', async () => {
      const vs = vectorSearchOf((await service.build(makeBlueprint(), baseDto())) as any[]);
      expect(vs.numCandidates).toBe(150);
      expect(vs.limit).toBe(50);
    });

    it('scales up numCandidates and limit when multiple aggressive filters stack', async () => {
      // 4 active filters: geo (near_me) + time (openNow) + price + attribute(size).
      const blueprint = makeBlueprint({
        near_me: true,
        price_filter: { operator: 'gt', value: 20, max_value: null, currency: 'EGP' },
        size: 'M',
      });
      const vs = vectorSearchOf((await service.build(blueprint, baseDto({ openNow: true }))) as any[]);

      expect(vs.numCandidates).toBe(350); // min(400, 150 + 4*50)
      expect(vs.limit).toBe(100); // min(100, 50 + 4*15)
      expect(vs.numCandidates).toBeGreaterThanOrEqual(vs.limit);
    });

    it('caps numCandidates at 400 even for top-rated queries with many filters', async () => {
      const blueprint = makeBlueprint({
        modifiers: { is_top_rated: true, is_cheap: false, is_luxury: false },
        near_me: true,
        rating_min: 4,
        size: 'L',
      });
      const vs = vectorSearchOf((await service.build(blueprint, baseDto({ openNow: true }))) as any[]);

      expect(vs.numCandidates).toBe(400); // min(400, 300 + 4*50)
      expect(vs.limit).toBe(100);
    });

    it('keeps the urgent low-latency base recall when filters are sparse', async () => {
      const vs = vectorSearchOf((await service.build(makeBlueprint({ urgency: true }), baseDto())) as any[]);
      expect(vs.numCandidates).toBe(50);
      expect(vs.limit).toBe(50);
    });

    it('applies the business_type pre-filter (lower-cased) when present', async () => {
      const vs = vectorSearchOf(
        (await service.build(makeBlueprint({ business_type: 'FAST_FOOD' as any }), baseDto())) as any[],
      );
      expect(vs.filter).toEqual({ businessType: 'fast_food' });
    });
  });
});
