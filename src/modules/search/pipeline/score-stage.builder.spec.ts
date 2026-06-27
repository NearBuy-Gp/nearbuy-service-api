import { Test, TestingModule } from '@nestjs/testing';
import { ScoreStageBuilder } from './score-stage.builder';

/**
 * Structural unit tests for ScoreStageBuilder.
 *
 * The builder is a pure pipeline-stage factory (no DB, no I/O), so we assert the
 * exact MongoDB `$addFields` document it produces. The key regression guarded
 * here is that `distance_score` is a real inverse-distance decay expression
 * (1 / (1 + distance_km)) rather than the old dead `1.0` constant, and that the
 * same decay actually feeds the 15% distance weight inside `final_score`.
 */
describe('ScoreStageBuilder', () => {
  let builder: ScoreStageBuilder;

  // The exact decay sub-expression the builder must emit.
  const distanceDecay = {
    $divide: [1, { $add: [1, { $ifNull: ['$distance_km', 9999] }] }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoreStageBuilder],
    }).compile();

    builder = module.get<ScoreStageBuilder>(ScoreStageBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  it('emits an $addFields stage with the exact weighted hybrid score', async () => {
    const stage = await builder.build();

    expect(stage).toEqual({
      $addFields: {
        rating_normalized: { $divide: [{ $ifNull: ['$businessRate', 0] }, 5] },
        distance_score: distanceDecay,
        final_score: {
          $add: [
            { $multiply: [{ $ifNull: ['$vectorScore', 0] }, 0.6] },
            { $multiply: [{ $divide: [{ $ifNull: ['$businessRate', 0] }, 5] }, 0.25] },
            { $multiply: [distanceDecay, 0.15] },
          ],
        },
      },
    });
  });

  it('no longer hardcodes distance_score to the dead 1.0 constant', async () => {
    const stage = (await builder.build()) as { $addFields: Record<string, unknown> };

    // Regression guard: a number here means the dead-constant bug has returned.
    expect(typeof stage.$addFields.distance_score).not.toBe('number');
    expect(stage.$addFields.distance_score).toEqual(distanceDecay);
  });

  it('feeds the inverse-distance decay into the 15% distance weight of final_score', async () => {
    const stage = (await builder.build()) as {
      $addFields: { final_score: { $add: unknown[] } };
    };

    const distanceTerm = stage.$addFields.final_score.$add[2];
    expect(distanceTerm).toEqual({ $multiply: [distanceDecay, 0.15] });
  });
});
