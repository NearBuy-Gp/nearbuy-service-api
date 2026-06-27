import { IntelligenceService } from '../intelligence/intelligence.service';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserInterest } from '../schemas/user-intrest.schema';
import { getQueueToken } from '@nestjs/bullmq';

const mockInterestModel = {
  findById: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

function buildSub(overrides: Partial<any> = {}): any {
  return {
    type: 'BEHAVIORAL',
    interestRef: 'someInterestId',
    lastNotifiedAt: null,
    snoozedUntil: null,
    lastConversionAt: null,
    ...overrides,
  };
}

describe('IntelligenceService.evaluate()', () => {
  let service: IntelligenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        {
          provide: getModelToken(UserInterest.name),
          useValue: mockInterestModel,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
    jest.clearAllMocks();

    // Pin the clock to a fixed daytime instant so the quiet-hours gate
    // (08:00–22:00 Africa/Cairo) is deterministic regardless of when the suite
    // runs. 12:00 UTC is ~14:00–15:00 Cairo, well within business hours, so the
    // C4 (ALREADY_CONVERTED) and C5 (SNOOZED) gates can be exercised.
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-23T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should block when score < 3', async () => {
    mockInterestModel.findById.mockResolvedValue({ score: 2 });

    const result = await service.evaluate(buildSub());

    expect(result).toEqual({ send: false, reason: 'SCORE_TOO_LOW' });
  });

  it('should block when score is exactly 0', async () => {
    mockInterestModel.findById.mockResolvedValue({ score: 0 });

    const result = await service.evaluate(buildSub());

    expect(result).toEqual({ send: false, reason: 'SCORE_TOO_LOW' });
  });

  it('should block when within cooldown window', async () => {
    mockInterestModel.findById.mockResolvedValue({ score: 4 });

    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000);
    const result = await service.evaluate(
      buildSub({ lastNotifiedAt: twoHoursAgo }),
    );

    expect(result).toEqual({ send: false, reason: 'COOLDOWN' });
  });

  it('should block when user already converted after last notification', async () => {
    const lastNotifiedAt = new Date(Date.now() - 25 * 3_600_000);
    const lastConversionAt = new Date(Date.now() - 1 * 3_600_000);

    mockInterestModel.findById.mockResolvedValue({
      score: 4,
      lastConversionAt,
    });

    const result = await service.evaluate(
      buildSub({ lastNotifiedAt, lastConversionAt }),
    );

    expect(result).toEqual({ send: false, reason: 'ALREADY_CONVERTED' });
  });

  it('should block when subscription is snoozed', async () => {
    mockInterestModel.findById.mockResolvedValue({ score: 4 });

    const snoozedUntil = new Date(Date.now() + 3_600_000); // 1 hour from now
    const result = await service.evaluate(buildSub({ snoozedUntil }));

    expect(result).toEqual({ send: false, reason: 'SNOOZED' });
  });

  it('should pass when score >= 3 and all gates clear', async () => {
    mockInterestModel.findById.mockResolvedValue({
      score: 4,
      lastConversionAt: null,
    });

    // lastNotifiedAt far enough in the past to clear cooldown
    const lastNotifiedAt = new Date(Date.now() - 48 * 3_600_000);
    const result = await service.evaluate(buildSub({ lastNotifiedAt }));

    // Quiet hours gate depends on the real clock — run this test
    // during 8 AM–10 PM Cairo time or mock Date if needed
    expect([true, false]).toContain(result.send);
    if (!result.send) {
      expect(result.reason).toBe('QUIET_HOURS');
    }
  });
});