import { Test, TestingModule } from '@nestjs/testing';
import { AttributeStageBuilder } from './attribute-stage.builder';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';

/**
 * Structural unit tests for AttributeStageBuilder.
 *
 * Verifies the `attributes.*` sub-field filters (size / color / brand /
 * membership validity), the size upper-casing, and stage omission when no
 * attribute entity is present.
 */
describe('AttributeStageBuilder', () => {
  let builder: AttributeStageBuilder;

  const blueprint = (entities: Partial<NlpBluePrint['entities']>): NlpBluePrint =>
    ({ entities } as NlpBluePrint);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttributeStageBuilder],
    }).compile();

    builder = module.get<AttributeStageBuilder>(AttributeStageBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  it('returns null when no attribute entities are present', async () => {
    const stage = await builder.build(blueprint({}));
    expect(stage).toBeNull();
  });

  it('normalises size to upper-case and uses $in', async () => {
    const stage = await builder.build(blueprint({ size: 'xl' }));
    expect(stage).toEqual({ $match: { 'attributes.sizes': { $in: ['XL'] } } });
  });

  it('builds a case-insensitive regex for color', async () => {
    const stage = await builder.build(blueprint({ color: 'red' }));
    expect(stage).toEqual({ $match: { 'attributes.colorsAvailable': { $regex: 'red', $options: 'i' } } });
  });

  it('builds a case-insensitive regex for brand', async () => {
    const stage = await builder.build(blueprint({ brand: 'nike' }));
    expect(stage).toEqual({ $match: { 'attributes.brand': { $regex: 'nike', $options: 'i' } } });
  });

  it('maps membership_duration_months to an attributes.validity regex', async () => {
    const stage = await builder.build(blueprint({ membership_duration_months: 6 }));
    expect(stage).toEqual({ $match: { 'attributes.validity': { $regex: '6', $options: 'i' } } });
  });

  it('combines multiple attribute filters into one $match', async () => {
    const stage = await builder.build(blueprint({ size: 'm', color: 'blue', brand: 'adidas' }));
    expect(stage).toEqual({
      $match: {
        'attributes.sizes': { $in: ['M'] },
        'attributes.colorsAvailable': { $regex: 'blue', $options: 'i' },
        'attributes.brand': { $regex: 'adidas', $options: 'i' },
      },
    });
  });
});
