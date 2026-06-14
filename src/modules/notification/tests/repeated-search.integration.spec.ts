import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotificationProcessor } from '../notification.processor';
import { UserInterest } from '../schemas/user-intrest.schema';
import { NotificationSubscription } from '../schemas/notification-subscriptions.schema';
import { NotificationDelivery } from '../schemas/notifiaction-delivery.schema';
import { InterestService } from '../interest/interest.service';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { FirebaseService } from '../../firebase/firebase/firebase.service';
import { UserService } from '../../user/user.service';
import { StaleFcmTokenError } from '../../firebase/firebase/firebase.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInterest(overrides: Partial<any> = {}) {
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    keyword: 'pizza',
    biz_type: 'RESTAURANT',
    category: 'FOOD',
    score: 4,
    rawScore: 4,
    lastDecayApplied: new Date(),
    lastConversionAt: null,
    searchHistory: [],
    ...overrides,
  };
}

function makeSub(
  userId: Types.ObjectId,
  interest: ReturnType<typeof makeInterest>,
  overrides: Partial<any> = {},
) {
  return {
    _id: new Types.ObjectId(),
    userId,
    type: 'BEHAVIORAL',
    interestRef: interest,
    isActive: true,
    notifyCount: 0,
    lastNotifiedAt: null,
    snoozedUntil: null,
    searchIntent: {
      businessType: 'RESTAURANT',
      businessCategory: 'FOOD',
      keywords: ['pizza'],
      original_query: 'pizza near me',
      modifiers: {},
    },
    geofence: { radiusMeters: 300 },
    updateOne: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

// ── Shared mocks ─────────────────────────────────────────────────────────────

const mockDeliveries: any[] = [];

const mockDeliveryModel = {
  create: jest.fn().mockImplementation((doc) => {
    const saved = { _id: new Types.ObjectId(), ...doc };
    mockDeliveries.push(saved);
    return Promise.resolve(saved);
  }),
};

const mockFirebaseService = {
  sendPush: jest.fn().mockResolvedValue(true),
};

const mockUserService = {
  getFcmToken: jest.fn().mockResolvedValue('fake-fcm-token-abc123'),
  clearFcmToken: jest.fn().mockResolvedValue(undefined),
};

const mockInterestService = {
  findById: jest.fn(),
  findOne: jest.fn(),
  record: jest.fn().mockResolvedValue(undefined),
};

const mockIntelligenceService = {
  evaluate: jest.fn().mockResolvedValue({ send: true }),
};

// ── Factory — builds a fresh TestingModule for each test ─────────────────────

async function buildModule(subModelOverride?: any): Promise<TestingModule> {
  const interest = currentInterest;

  const defaultSubModel = {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(currentSub),
    }),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    }),
  };

  return Test.createTestingModule({
    providers: [
      NotificationProcessor,
      {
        provide: getModelToken(NotificationSubscription.name),
        useValue: subModelOverride ?? defaultSubModel,
      },
      {
        provide: getModelToken(NotificationDelivery.name),
        useValue: mockDeliveryModel,
      },
      // ← key fix: provide by class reference, not string
      {
        provide: FirebaseService,
        useValue: mockFirebaseService,
      },
      {
        provide: IntelligenceService,
        useValue: mockIntelligenceService,
      },
      {
        provide: InterestService,
        useValue: mockInterestService,
      },
      {
        provide: UserService,
        useValue: mockUserService,
      },
    ],
  }).compile();
}

// ── Module-level state shared across tests ────────────────────────────────────

let currentInterest: ReturnType<typeof makeInterest>;
let currentSub: ReturnType<typeof makeSub>;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificationProcessor — REPEATED_SEARCH', () => {
  let processor: NotificationProcessor;

  beforeEach(async () => {
    currentInterest = makeInterest();
    currentSub = makeSub(currentInterest.userId, currentInterest);

    jest.clearAllMocks();
    mockDeliveries.length = 0;

    mockFirebaseService.sendPush.mockResolvedValue(true);
    mockUserService.getFcmToken.mockResolvedValue('fake-fcm-token-abc123');
    mockUserService.clearFcmToken.mockResolvedValue(undefined);
    mockInterestService.findById.mockResolvedValue(currentInterest);
    mockInterestService.record.mockResolvedValue(undefined);
    mockIntelligenceService.evaluate.mockResolvedValue({ send: true });
    mockDeliveryModel.create.mockImplementation((doc) => {
      const saved = { _id: new Types.ObjectId(), ...doc };
      mockDeliveries.push(saved);
      return Promise.resolve(saved);
    });

    const module = await buildModule();
    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  it('should send notification and log delivery when score >= 3', async () => {
    await processor.process({
      name: 'REPEATED_SEARCH',
      data: {
        userId: currentInterest.userId.toString(),
        interestId: currentInterest._id.toString(),
      },
    } as any);

    expect(mockFirebaseService.sendPush).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fake-fcm-token-abc123',
        title: 'Still looking? 🔍',
        data: expect.objectContaining({ type: 'BEHAVIORAL' }),
      }),
    );

    expect(mockDeliveryModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'BEHAVIORAL',
        status: 'SENT',
        channel: 'FCM',
        scoreAtSend: 4,
      }),
    );

    const createdDelivery = mockDeliveryModel.create.mock.calls[0][0];
    expect(createdDelivery.searchContext).toBeDefined();
    expect(createdDelivery.searchContext.keyword).toBe('pizza');
    expect(createdDelivery.searchContext.businessType).toBe('RESTAURANT');

    expect(currentSub.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        $inc: { notifyCount: 1 },
      }),
    );
  });

  it('should NOT send when score < 3', async () => {
    mockInterestService.findById.mockResolvedValue({
      ...currentInterest,
      score: 1,
    });

    await processor.process({
      name: 'REPEATED_SEARCH',
      data: {
        userId: currentInterest.userId.toString(),
        interestId: currentInterest._id.toString(),
      },
    } as any);

    expect(mockFirebaseService.sendPush).not.toHaveBeenCalled();
    expect(mockDeliveryModel.create).not.toHaveBeenCalled();
  });

  it('should NOT send when user converted within last 7 days', async () => {
    mockInterestService.findById.mockResolvedValue({
      ...currentInterest,
      lastConversionAt: new Date(Date.now() - 2 * 86_400_000),
    });

    await processor.process({
      name: 'REPEATED_SEARCH',
      data: {
        userId: currentInterest.userId.toString(),
        interestId: currentInterest._id.toString(),
      },
    } as any);

    expect(mockFirebaseService.sendPush).not.toHaveBeenCalled();
  });

  it('should NOT send when no matching subscription found', async () => {
    const nullSubModel = {
      findOne: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      }),
    };

    const module = await buildModule(nullSubModel);
    const proc = module.get<NotificationProcessor>(NotificationProcessor);

    await proc.process({
      name: 'REPEATED_SEARCH',
      data: {
        userId: currentInterest.userId.toString(),
        interestId: currentInterest._id.toString(),
      },
    } as any);

    expect(mockFirebaseService.sendPush).not.toHaveBeenCalled();
  });

  it('should NOT send when intelligence gate blocks', async () => {
    mockIntelligenceService.evaluate.mockResolvedValue({
      send: false,
      reason: 'COOLDOWN',
    });

    await processor.process({
      name: 'REPEATED_SEARCH',
      data: {
        userId: currentInterest.userId.toString(),
        interestId: currentInterest._id.toString(),
      },
    } as any);

    expect(mockFirebaseService.sendPush).not.toHaveBeenCalled();
  });

  it('should clear stale FCM token and not throw', async () => {
  mockFirebaseService.sendPush.mockRejectedValue(
    new StaleFcmTokenError('fake-fcm-token-abc123'),
  );

  await expect(
    processor.process({
      name: 'REPEATED_SEARCH',
      data: {
        userId: currentInterest.userId.toString(),
        interestId: currentInterest._id.toString(),
      },
    } as any),
  ).resolves.not.toThrow();

  expect(mockUserService.clearFcmToken).toHaveBeenCalledWith(
    currentInterest.userId.toString(),
    );
  });
});