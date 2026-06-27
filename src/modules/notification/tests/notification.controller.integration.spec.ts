import { INestApplication, BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import request from 'supertest';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';
import { AuthGuard } from '../../auth/guards/jwt-auth.guard';

// The id the stub guard injects as the authenticated user. Handlers must read
// req.user.id (not req.user.sub) and pass it straight through to the service.
const TEST_USER_ID = new Types.ObjectId().toHexString();

const mockNotificationService = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  isSubscribed: jest.fn(),
  snooze: jest.fn(),
};

// Stub guard: stands in for JWT verification and populates req.user the same
// shape the real AuthGuard does ({ id, email, role, businessId }).
const stubAuthGuard = {
  canActivate: (context: any) => {
    const req = context.switchToHttp().getRequest();
    req.user = { id: TEST_USER_ID, email: 'test@nearbuy.app', role: 'USER' };
    return true;
  },
};

describe('NotificationController (integration, authenticated)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: mockNotificationService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(stubAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    // Mirror the production pipe so DTO validation behaves identically.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) =>
          new BadRequestException(errors.flatMap((e) => Object.values(e.constraints ?? {}))),
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('GET /notifications/subscriptions/check', () => {
    it('routes to the check handler (200, not a 201 from another route) and returns the status', async () => {
      mockNotificationService.isSubscribed.mockResolvedValue(true);
      const businessId = new Types.ObjectId().toHexString();

      const res = await request(app.getHttpServer())
        .get('/notifications/subscriptions/check')
        .query({ type: 'BUSINESS_OPEN', businessId });

      expect(res.status).toBe(200);
      // A bare boolean is serialized into the text body, not res.body.
      expect(res.text).toBe('true');
      // Proves the literal /check route wins and the authenticated user id is
      // forwarded (req.user.id, not the undefined req.user.sub that 500'd before).
      expect(mockNotificationService.isSubscribed).toHaveBeenCalledWith(TEST_USER_ID, {
        type: 'BUSINESS_OPEN',
        businessId,
        itemId: undefined,
      });
    });

    it('returns false when the user is not subscribed', async () => {
      mockNotificationService.isSubscribed.mockResolvedValue(false);

      const res = await request(app.getHttpServer())
        .get('/notifications/subscriptions/check')
        .query({ type: 'BUSINESS_OPEN' });

      expect(res.status).toBe(200);
      expect(res.text).toBe('false');
    });
  });

  describe('POST /notifications/subscribe', () => {
    it('creates a subscription for the authenticated user (201, no 500)', async () => {
      const businessId = new Types.ObjectId().toHexString();
      const created = { _id: new Types.ObjectId().toHexString(), type: 'BUSINESS_OPEN', businessId };
      mockNotificationService.subscribe.mockResolvedValue(created);

      const res = await request(app.getHttpServer())
        .post('/notifications/subscribe')
        .send({ type: 'BUSINESS_OPEN', businessId });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(mockNotificationService.subscribe).toHaveBeenCalledWith(TEST_USER_ID, {
        type: 'BUSINESS_OPEN',
        businessId,
      });
    });

    it('rejects an invalid notification type with 400 (DTO validation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/subscribe')
        .send({ type: 'NOT_A_REAL_TYPE' });

      expect(res.status).toBe(400);
      expect(mockNotificationService.subscribe).not.toHaveBeenCalled();
    });
  });
});
