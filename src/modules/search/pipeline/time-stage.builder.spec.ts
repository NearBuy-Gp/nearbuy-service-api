import { Test, TestingModule } from '@nestjs/testing';
import { TimeStageBuilder } from './time-stage.builder';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { TimeConstraints } from '../interfaces/nlp-blue-print.interface';

/**
 * Structural unit tests for TimeStageBuilder.
 *
 * Two behaviours are guarded here:
 *  1. The "open right now" paths (DTO openNow / NLP is_now) must NOT re-run the
 *     heavy $anyElementTrue/$map expression — they must reuse the precomputed
 *     `isOpenNow` field via a simple `{ $match: { isOpenNow: true } }`.
 *  2. The specific day+time path still emits the overnight-aware $expr walk, and
 *     the day-only path uses $elemMatch.
 */
describe('TimeStageBuilder', () => {
  let builder: TimeStageBuilder;

  const blueprint = (time_constraints: TimeConstraints | null): NlpBluePrint =>
    ({ entities: { time_constraints } } as NlpBluePrint);

  const tc = (overrides: Partial<TimeConstraints>): TimeConstraints => ({
    target_time: null,
    day_of_week: null,
    is_now: false,
    is_relative: false,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeStageBuilder],
    }).compile();

    builder = module.get<TimeStageBuilder>(TimeStageBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  describe('open-now paths reuse the precomputed isOpenNow field', () => {
    it('DTO openNow=true matches the isOpenNow boolean (no $expr re-computation)', async () => {
      const stage = await builder.build(blueprint(null), { openNow: true } as SearchRequestDto);
      expect(stage).toEqual({ $match: { isOpenNow: true } });
    });

    it('NLP is_now=true matches the isOpenNow boolean', async () => {
      const stage = await builder.build(blueprint(tc({ is_now: true })));
      expect(stage).toEqual({ $match: { isOpenNow: true } });
    });

    it('does not emit the $anyElementTrue/$map walk for the now-paths', async () => {
      const stage = await builder.build(blueprint(null), { openNow: true } as SearchRequestDto);
      // The whole point of the de-duplication fix: no $expr here.
      expect(JSON.stringify(stage)).not.toContain('$anyElementTrue');
      expect(JSON.stringify(stage)).not.toContain('$map');
    });
  });

  describe('specific day + time path', () => {
    it('emits an overnight-aware $expr walk against workingHours', async () => {
      const stage = (await builder.build(blueprint(tc({ day_of_week: 'Monday', target_time: '6:00 pm' })))) as any;

      expect(stage.$match.$expr.$anyElementTrue.$map.input).toEqual({ $ifNull: ['$workingHours', []] });
      expect(stage.$match.$expr.$anyElementTrue.$map.as).toBe('wh');

      // Day is lower-cased and the 12h time is normalised to 24h "18:00".
      const conditions = stage.$match.$expr.$anyElementTrue.$map.in.$and;
      expect(conditions).toContainEqual({ $eq: ['$$wh.day', 'monday'] });
      expect(conditions).toContainEqual({ $eq: ['$$wh.isClosed', false] });
      expect(JSON.stringify(stage)).toContain('18:00');
    });
  });

  describe('day-only path', () => {
    it('uses $elemMatch on workingHours', async () => {
      const stage = await builder.build(blueprint(tc({ day_of_week: 'Friday' })));
      expect(stage).toEqual({
        $match: { workingHours: { $elemMatch: { day: 'friday', isClosed: false } } },
      });
    });
  });

  describe('no constraints', () => {
    it('returns null when there is no time constraint and no openNow', async () => {
      const stage = await builder.build(blueprint(null), {} as SearchRequestDto);
      expect(stage).toBeNull();
    });

    it('returns null when time_constraints is absent', async () => {
      const stage = await builder.build(blueprint(null));
      expect(stage).toBeNull();
    });
  });
});
