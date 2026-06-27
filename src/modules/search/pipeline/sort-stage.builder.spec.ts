import { Test, TestingModule } from '@nestjs/testing';
import { SortStageBuilder } from './sort-stage.builder';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';

/**
 * Structural unit tests for SortStageBuilder.
 *
 * Verifies the priority chain: DTO priceSort override > NLP sort mapping >
 * default final_score, and the NLP field-name mapping.
 */
describe('SortStageBuilder', () => {
  let builder: SortStageBuilder;

  // Minimal blueprint exposing only the `sort` entity the builder reads.
  const blueprintWithSort = (sort: NlpBluePrint['entities']['sort'] | undefined): NlpBluePrint =>
    ({ entities: { sort } } as unknown as NlpBluePrint);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SortStageBuilder],
    }).compile();

    builder = module.get<SortStageBuilder>(SortStageBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  describe('DTO priceSort override (highest priority)', () => {
    it('maps "cheap" to ascending price sort', async () => {
      const stage = await builder.build(blueprintWithSort(undefined), { priceSort: 'cheap' } as SearchRequestDto);
      expect(stage).toEqual({ $sort: { price: 1 } });
    });

    it('maps "expensive" to descending price sort', async () => {
      const stage = await builder.build(blueprintWithSort(undefined), { priceSort: 'expensive' } as SearchRequestDto);
      expect(stage).toEqual({ $sort: { price: -1 } });
    });

    it('takes precedence over a conflicting NLP sort', async () => {
      const stage = await builder.build(
        blueprintWithSort({ by: 'rating', order: 'desc' }),
        { priceSort: 'cheap' } as SearchRequestDto,
      );
      expect(stage).toEqual({ $sort: { price: 1 } });
    });
  });

  describe('NLP sort mapping', () => {
    it.each([
      ['price', 'asc', { price: 1 }],
      ['rating', 'desc', { businessRate: -1 }],
      ['distance', 'asc', { distance_km: 1 }],
      ['popularity', 'desc', { final_score: -1 }],
    ])('maps by=%s order=%s to %o', async (by, order, expected) => {
      const stage = await builder.build(
        blueprintWithSort({ by: by as any, order: order as any }),
        {} as SearchRequestDto,
      );
      expect(stage).toEqual({ $sort: expected });
    });
  });

  describe('default', () => {
    it('falls back to final_score descending when nothing is specified', async () => {
      const stage = await builder.build(blueprintWithSort(undefined), {} as SearchRequestDto);
      expect(stage).toEqual({ $sort: { final_score: -1 } });
    });
  });
});
