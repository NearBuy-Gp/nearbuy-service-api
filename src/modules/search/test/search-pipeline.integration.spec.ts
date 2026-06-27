import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Types, Schema as MongooseSchema } from 'mongoose';

import { PipelineBuilderService } from '../pipeline/pipeline-builder.service';
import { GeoStageBuilder } from '../pipeline/geo-stage.builder';
import { TimeStageBuilder } from '../pipeline/time-stage.builder';
import { PriceRatingStageBuilder } from '../pipeline/price-rating-stage.builder';
import { ProjectionStageBuilder } from '../pipeline/projection-stage.builder';
import { ScoreStageBuilder } from '../pipeline/score-stage.builder';
import { AttributeStageBuilder } from '../pipeline/attribute-stage.builder';
import { SortStageBuilder } from '../pipeline/sort-stage.builder';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { getDayName } from '../utils/time-normalization';

/**
 * Pipeline EXECUTION integration test.
 *
 * Goal: prove the array produced by PipelineBuilderService is something a real
 * MongoDB driver can parse and execute without throwing — i.e. the aggregation
 * expressions (Haversine $let, isOpenNow $map, $match filters, weighted $addFields
 * score, $sort, $project) are syntactically and semantically valid.
 *
 * ── Important architectural note ───────────────────────────────────────────────
 * `$vectorSearch` is a MongoDB *Atlas*-managed stage backed by a Lucene vector
 * index. It does NOT run on a self-hosted `mongod` nor on `mongodb-memory-server`.
 * Therefore:
 *   • The portable stages (everything after the ANN search) are executed here
 *     against any real MongoDB by substituting the $vectorSearch stage with a
 *     deterministic `vectorScore` shim (Tests A & B).
 *   • The TRUE end-to-end $vectorSearch run is gated behind RUN_ATLAS_VECTOR_TESTS
 *     and a MONGODB_TEST_URI that points at an Atlas cluster whose `items`
 *     collection has the `vector_index` configured (Test C).
 *
 * ── How to run ────────────────────────────────────────────────────────────────
 * This file matches the project's jest `testRegex` (`.*\.spec\.ts$`), so it is
 * picked up by a normal `npm test` run. It only executes when MONGODB_TEST_URI
 * is set — otherwise the suite self-skips so unit-only CI stays green:
 *
 *   MONGODB_TEST_URI="mongodb://localhost:27017/nearbuy_test" npm test
 *
 * To run this file alone:
 *
 *   MONGODB_TEST_URI="mongodb://localhost:27017/nearbuy_test" \
 *     npx jest src/modules/search/test/search-pipeline.integration.spec.ts
 */

const TEST_URI = process.env.MONGODB_TEST_URI;
const RUN_ATLAS_VECTOR = process.env.RUN_ATLAS_VECTOR_TESTS === 'true';

// We deliberately bind a permissive (`strict: false`) schema to the real `items`
// collection rather than importing the production `ItemSchema`. The pipeline runs
// as raw aggregation against the collection, so it does not need the decorated
// model — and importing it would fail under ts-jest's `isolatedModules` mode,
// which cannot emit the `@Prop()` reflection metadata Mongoose relies on.
const ITEM_MODEL = 'Item';
const ItemTestSchema = new MongooseSchema({}, { collection: 'items', strict: false });

// A unique tag so cleanup only ever touches docs this run inserted — never wipes
// a shared collection.
const RUN_TAG = `itest-${new Date().toISOString()}-${Math.random().toString(36).slice(2)}`;

// 384-dim embedding to mirror the production vector contract.
const fakeEmbedding = (seed: number): number[] => Array.from({ length: 384 }, (_, i) => ((seed + i) % 7) / 10);

const USER_LAT = 30.0444;
const USER_LNG = 31.2357;

/**
 * Seed documents: denormalised `items` with embeddings, GeoJSON coordinates,
 * store text fields, working hours and ratings. `workingHours` uses the lower-
 * cased `day/from/to/isClosed` keys the pipeline expressions read.
 */
function seedDocs() {
  const openAllDayToday = [{ day: getDayName(), from: '00:00', to: '23:59', isClosed: false }];

  return [
    {
      _id: new Types.ObjectId(),
      name: 'Margherita Pizza',
      description: 'classic cheese pizza',
      price: 90,
      images: ['https://img/pizza1.jpg'],
      isAvailable: true,
      businessId: new Types.ObjectId(),
      categoryId: new Types.ObjectId(),
      type: 'restaurant',
      businessName: 'Tony Pizzeria',
      businessCategory: 'restaurant',
      businessType: 'fast_food',
      location: { type: 'Point', coordinates: [USER_LNG + 0.01, USER_LAT + 0.01] }, // ~1.5km
      businessRate: 4.6,
      workingHours: openAllDayToday,
      embedding: fakeEmbedding(1),
      attributes: { tags: ['pizza', 'italian'] },
      __testTag: RUN_TAG,
    },
    {
      _id: new Types.ObjectId(),
      name: 'Pepperoni Pizza',
      description: 'spicy pepperoni',
      price: 140,
      images: ['https://img/pizza2.jpg'],
      isAvailable: true,
      businessId: new Types.ObjectId(),
      categoryId: new Types.ObjectId(),
      type: 'restaurant',
      businessName: 'Mario Kitchen',
      businessCategory: 'restaurant',
      businessType: 'fast_food',
      location: { type: 'Point', coordinates: [USER_LNG + 0.03, USER_LAT + 0.02] }, // ~3.9km
      businessRate: 4.1,
      workingHours: openAllDayToday,
      embedding: fakeEmbedding(2),
      attributes: { tags: ['pizza'] },
      __testTag: RUN_TAG,
    },
    {
      _id: new Types.ObjectId(),
      name: 'Veggie Pizza',
      description: 'vegetarian',
      price: 200,
      images: [],
      isAvailable: true,
      businessId: new Types.ObjectId(),
      categoryId: new Types.ObjectId(),
      type: 'restaurant',
      businessName: 'Green Slice',
      businessCategory: 'restaurant',
      businessType: 'fast_food',
      location: { type: 'Point', coordinates: [USER_LNG + 0.5, USER_LAT + 0.5] }, // far (~70km)
      businessRate: 3.2,
      workingHours: openAllDayToday,
      embedding: fakeEmbedding(3),
      attributes: {},
      __testTag: RUN_TAG,
    },
  ];
}

/** A neutral IN_SCOPE blueprint; the test drives geo via the near_me path. */
function makeBlueprint(overrides: Partial<NlpBluePrint['entities']> = {}): NlpBluePrint {
  return {
    text: 'pizza near me',
    intent: 'FIND_PRODUCT',
    confidence: 0.95,
    entities: {
      category: undefined as any,
      business_type: undefined as any,
      brand: undefined as any,
      quantity: undefined as any,
      locations: [],
      near_me: true,
      distance_km: 10,
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
    query_vector: fakeEmbedding(0),
    search_vector_query: 'pizza near me',
  } as unknown as NlpBluePrint;
}

/**
 * Replace the Atlas-only `$vectorSearch` with a deterministic shim so the rest
 * of the pipeline can be executed on any MongoDB. Drops the `$meta:
 * 'vectorSearchScore'` extraction (invalid outside a vector search) and injects
 * a constant `vectorScore` the downstream ScoreStageBuilder can consume.
 */
function substituteVectorSearch(pipeline: any[]): any[] {
  return pipeline.flatMap((stage) => {
    if (stage && stage.$vectorSearch) {
      return [{ $addFields: { vectorScore: 0.87 } }];
    }
    if (stage && stage.$addFields && stage.$addFields.vectorScore && (stage.$addFields.vectorScore as any).$meta) {
      return [];
    }
    return [stage];
  });
}

const describeOrSkip = TEST_URI ? describe : describe.skip;

if (!TEST_URI) {
  // eslint-disable-next-line no-console
  console.warn('[search-pipeline.integration] MONGODB_TEST_URI not set — skipping pipeline execution integration tests.');
}

describeOrSkip('Search pipeline execution (integration)', () => {
  let moduleRef: TestingModule;
  let itemModel: Model<any>;
  let builder: PipelineBuilderService;
  const dto: SearchRequestDto = { query: 'pizza near me', userLocation: [USER_LAT, USER_LNG] } as SearchRequestDto;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(TEST_URI as string, { serverSelectionTimeoutMS: 8000 }),
        MongooseModule.forFeature([{ name: ITEM_MODEL, schema: ItemTestSchema }]),
      ],
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

    itemModel = moduleRef.get<Model<any>>(getModelToken(ITEM_MODEL));
    builder = moduleRef.get<PipelineBuilderService>(PipelineBuilderService);

    // Clean slate, then seed.
    await itemModel.deleteMany({ __testTag: RUN_TAG });
    await itemModel.insertMany(seedDocs(), { ordered: true });
  }, 30000);

  afterAll(async () => {
    if (itemModel) await itemModel.deleteMany({ __testTag: RUN_TAG });
    if (moduleRef) await moduleRef.close();
  });

  it('connects and seeds the items collection', async () => {
    const count = await itemModel.countDocuments({ __testTag: RUN_TAG });
    expect(count).toBe(3);
  });

  // ── Test A: OUT_OF_SCOPE pipeline runs verbatim on any MongoDB ────────────────
  it('executes the OUT_OF_SCOPE pipeline (Haversine + isOpenNow + projection) without throwing', async () => {
    const outOfScope = await builder.build(
      { ...makeBlueprint(), intent: 'OUT_OF_SCOPE' } as NlpBluePrint,
      dto,
    );
    expect(Array.isArray(outOfScope)).toBe(true);

    const results = await itemModel.aggregate(outOfScope as any[]);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    // Enrichment + projection contract: distance rounded, isOpenNow boolean present.
    for (const row of results) {
      expect(typeof row.distance_km).toBe('number');
      expect(typeof row.isOpenNow).toBe('boolean');
      expect(row).toHaveProperty('name');
      expect(row).not.toHaveProperty('_id');
    }
  });

  // ── Test B: full IN_SCOPE pipeline (vector stage shimmed) executes cleanly ─────
  it('executes the full IN_SCOPE filter+score+sort+project pipeline (vector shimmed) without driver errors', async () => {
    const blueprint = makeBlueprint({
      price_filter: { operator: 'lt', value: 180, max_value: null, currency: 'EGP' },
      rating_min: 4,
    });

    const fullPipeline = await builder.build(blueprint, { ...dto, openNow: true } as SearchRequestDto);
    const runnable = substituteVectorSearch(fullPipeline as any[]);

    const results = await itemModel.aggregate(runnable);

    expect(Array.isArray(results)).toBe(true);
    // price < 180 AND businessRate >= 4 -> only the first two docs qualify.
    expect(results.length).toBe(2);

    // Projection shape is intact and results are distance-sorted by final_score
    // (nearer + higher-rated first).
    const [top] = results;
    expect(top).toMatchObject({
      name: expect.any(String),
      rate: expect.any(Number),
      isOpenNow: true,
    });
    expect(top.name).toBe('Tony Pizzeria'); // nearest + highest rated of the survivors
  });

  it('returns an empty array (not an error) when filters exclude everything', async () => {
    const blueprint = makeBlueprint({ rating_min: 5 }); // none of the seeds reach 5.0
    const fullPipeline = await builder.build(blueprint, dto);
    const runnable = substituteVectorSearch(fullPipeline as any[]);

    const results = await itemModel.aggregate(runnable);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(0);
  });

  // ── Test C: real $vectorSearch — only against a configured Atlas cluster ───────
  (RUN_ATLAS_VECTOR ? it : it.skip)(
    'executes the real $vectorSearch pipeline end-to-end on Atlas',
    async () => {
      const pipeline = await builder.build(makeBlueprint(), dto);
      const results = await itemModel.aggregate(pipeline as any[]);
      expect(Array.isArray(results)).toBe(true);
    },
    60000,
  );
});
