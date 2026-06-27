import { Test, TestingModule } from '@nestjs/testing';
import { ProjectionStageBuilder } from './projection-stage.builder';

/**
 * Structural unit tests for ProjectionStageBuilder.
 *
 * Guards the external response contract: the final `$project` shape consumed by
 * API clients. Any change here is a breaking change to the search response.
 */
describe('ProjectionStageBuilder', () => {
  let builder: ProjectionStageBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectionStageBuilder],
    }).compile();

    builder = module.get<ProjectionStageBuilder>(ProjectionStageBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  it('emits the exact response projection shape', async () => {
    const stage = await builder.build();

    expect(stage).toEqual({
      $project: {
        _id: 0,
        businessId: '$businessId',
        name: '$businessName',
        category: '$businessCategory',
        rate: '$businessRate',
        photo: { $arrayElemAt: ['$images', 0] },
        isOpenNow: 1,
        distance_km: { $round: ['$distance_km', 2] },
      },
    });
  });

  it('never leaks internal ranking fields (final_score / vectorScore)', async () => {
    const stage = (await builder.build()) as { $project: Record<string, unknown> };

    expect(stage.$project).not.toHaveProperty('final_score');
    expect(stage.$project).not.toHaveProperty('vectorScore');
    expect(stage.$project._id).toBe(0);
  });
});
