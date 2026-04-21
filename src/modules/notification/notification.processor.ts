// src/notifications/notification.processor.ts
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { FirebaseService, StaleFcmTokenError } from '../firebase/firebase/firebase.service';
import { NotificationDelivery } from './schemas/notifiaction-delivery.schema';
import { NotificationSubscription } from './schemas/notification-subscriptions.schema';

interface NotifPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectModel(NotificationSubscription.name)
    private subModel: Model<NotificationSubscription>,
    @InjectModel(NotificationDelivery.name)
    private deliveryModel: Model<NotificationDelivery>,
    private firebaseService: FirebaseService,
    // private intelligenceService: IntelligenceService,
    // private interestService: InterestService,
    // private usersService: UsersService,
  ) {}

  // ── Type 1: Item back in stock ──────────────────────────────────
  @Process('RESTOCK')
  async handleRestock(job: Job<{ businessId: string; itemId: string; itemName: string }>) {
    const subs = await this.subModel
      .find({
        type: 'RESTOCK',
        itemId: job.data.itemId,
        isActive: true,
        $or: [{ snoozedUntil: null }, { snoozedUntil: { $lt: new Date() } }],
      })
      .populate('interestRef');

    this.logger.log(`RESTOCK: found ${subs.length} subscribers for item ${job.data.itemId}`);

    for (const sub of subs) {
      const gate = await this.intelligenceService.evaluate(sub, job);
      if (!gate.send) {
        this.logger.debug(`RESTOCK gate blocked: ${gate.reason}`);
        continue;
      }
      await this.send(sub, {
        title: 'Back in stock!',
        body: `${job.data.itemName} is available again`,
        data: {
          type: 'RESTOCK',
          businessId: job.data.businessId,
          itemId: job.data.itemId,
        },
      });
    }
  }

  // ── Type 2: Store just opened ───────────────────────────────────
  @Process('BUSINESS_OPEN')
  async handleBusinessOpen(job: Job<{ businessId: string; businessName: string }>) {
    const subs = await this.subModel
      .find({
        type: 'BUSINESS_OPEN',
        businessId: job.data.businessId,
        isActive: true,
        $or: [{ snoozedUntil: null }, { snoozedUntil: { $lt: new Date() } }],
      })
      .populate('interestRef');

    for (const sub of subs) {
      const gate = await this.intelligenceService.evaluate(sub, job);
      if (!gate.send) continue;
      await this.send(sub, {
        title: 'Now open!',
        body: `${job.data.businessName} just opened`,
        data: { type: 'BUSINESS_OPEN', businessId: job.data.businessId },
      });
    }
  }

  // ── Type 5: Repeated search (enqueued by SearchService) ─────────
  @Process('REPEATED_SEARCH')
  async handleRepeatedSearch(job: Job<{ userId: string; interestId: string }>) {
    const sub = await this.subModel
      .findOne({
        userId: job.data.userId,
        type: 'BEHAVIORAL',
        isActive: true,
      })
      .populate('interestRef');

    if (!sub) return;

    const interest = sub.interestRef as any;
    if (!interest || interest.score < 3) return;
    if (interest.lastConversionAt) {
      const daysSince = (Date.now() - interest.lastConversionAt.getTime()) / 86400000;
      if (daysSince < 7) return; // already converted recently
    }

    const gate = await this.intelligenceService.evaluate(sub, job);
    if (!gate.send) return;

    await this.send(sub, {
      title: 'Still looking?',
      body: `You searched "${interest.keyword}" ${Math.floor(interest.rawScore)} times — found nearby!`,
      data: { type: 'BEHAVIORAL', keyword: interest.keyword },
    });
  }

  // ── Shared send helper (used by ALL handlers) ───────────────────
  private async send(sub: any, payload: NotifPayload): Promise<void> {
    const token = await this.usersService.getFcmToken(sub.userId);
    if (!token) {
      this.logger.warn(`No FCM token for user ${sub.userId}`);
      return;
    }

    try {
      await this.firebaseService.sendPush({ token, ...payload });
    } catch (err) {
      if (err instanceof StaleFcmTokenError) {
        await this.usersService.clearFcmToken(sub.userId);
      }
      return; // don't throw — don't retry after a successful FCM send
    }

    // Everything below: best-effort. Never throw — notification was already sent.
    try {
      await sub.updateOne({
        lastNotifiedAt: new Date(),
        $inc: { notifyCount: 1 },
      });

      await this.deliveryModel.create({
        subscriptionId: sub._id,
        userId: sub.userId,
        type: sub.type,
        businessId: sub.businessId,
        itemId: sub.itemId,
        triggeredAt: new Date(),
        channel: 'FCM',
        status: 'SENT',
        scoreAtSend: (sub.interestRef as any)?.score ?? 0,
      });

      const intent = sub.searchIntent;
      await this.interestService.record(sub.userId, 'NOTIFICATION_SENT', {
        keyword: intent?.keywords?.[0] ?? '',
        biz_type: intent?.business_type ?? '',
        category: intent?.category ?? '',
      });
    } catch (err) {
      this.logger.error('Post-send bookkeeping failed (non-critical)', err);
    }
  }
}
