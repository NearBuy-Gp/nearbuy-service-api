import { Test, TestingModule } from '@nestjs/testing';
import { PriceRatingStageBuilder } from './price-rating-stage.builder';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';

/**
 * Structural unit tests for PriceRatingStageBuilder.
 *
 * Verifies the override priority (DTO values beat NLP-extracted values), the
 * three NLP price operators (lt / gt / range), and that the stage is omitted
 * (null) when no price/rating constraint is present.
 */
describe('PriceRatingStageBuilder', () => {
  let builder: PriceRatingStageBuilder;

  const blueprint = (entities: Partial<NlpBluePrint['entities']>): NlpBluePrint =>
    ({ entities } as NlpBluePrint);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceRatingStageBuilder],
    }).compile();

    builder = module.get<PriceRatingStageBuilder>(PriceRatingStageBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  it('returns null when neither DTO nor NLP supply price/rating filters', async () => {
    const stage = await builder.build(blueprint({}), {} as SearchRequestDto);
    expect(stage).toBeNull();
  });

  describe('DTO overrides', () => {
    it('builds a businessRate floor from ratingMin', async () => {
      const stage = await builder.build(blueprint({}), { ratingMin: 4 } as SearchRequestDto);
      expect(stage).toEqual({ $match: { businessRate: { $gte: 4 } } });
    });

    it('builds an inclusive price range from priceMin + priceMax', async () => {
      const stage = await builder.build(blueprint({}), { priceMin: 50, priceMax: 200 } as SearchRequestDto);
      expect(stage).toEqual({ $match: { price: { $gte: 50, $lte: 200 } } });
    });

    it('honours a lone priceMin (open upper bound)', async () => {
      const stage = await builder.build(blueprint({}), { priceMin: 50 } as SearchRequestDto);
      expect(stage).toEqual({ $match: { price: { $gte: 50 } } });
    });

    it('lets DTO values override NLP-extracted values', async () => {
      const stage = await builder.build(
        blueprint({ rating_min: 2, price_filter: { operator: 'lt', value: 999, max_value: null, currency: 'EGP' } }),
        { ratingMin: 5, priceMin: 10, priceMax: 20 } as SearchRequestDto,
      );
      expect(stage).toEqual({ $match: { businessRate: { $gte: 5 }, price: { $gte: 10, $lte: 20 } } });
    });
  });

  describe('NLP fallback', () => {
    it('maps rating_min to a businessRate floor', async () => {
      const stage = await builder.build(blueprint({ rating_min: 3 }), {} as SearchRequestDto);
      expect(stage).toEqual({ $match: { businessRate: { $gte: 3 } } });
    });

    it('maps operator "lt" to $lte', async () => {
      const stage = await builder.build(
        blueprint({ price_filter: { operator: 'lt', value: 100, max_value: null, currency: 'EGP' } }),
        {} as SearchRequestDto,
      );
      expect(stage).toEqual({ $match: { price: { $lte: 100 } } });
    });

    it('maps operator "gt" to $gte', async () => {
      const stage = await builder.build(
        blueprint({ price_filter: { operator: 'gt', value: 100, max_value: null, currency: 'EGP' } }),
        {} as SearchRequestDto,
      );
      expect(stage).toEqual({ $match: { price: { $gte: 100 } } });
    });

    it('maps operator "range" to an inclusive $gte/$lte band', async () => {
      const stage = await builder.build(
        blueprint({ price_filter: { operator: 'range', value: 50, max_value: 150, currency: 'EGP' } }),
        {} as SearchRequestDto,
      );
      expect(stage).toEqual({ $match: { price: { $gte: 50, $lte: 150 } } });
    });
  });
});
