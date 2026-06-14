// src/notifications/notification.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { FirebaseService, StaleFcmTokenError } from '../firebase/firebase/firebase.service';
import { NotificationDelivery,NotificationDeliveryDocument } from './schemas/notifiaction-delivery.schema';
import { NotificationSubscription, NotificationSubscriptionDocument, } from './schemas/notification-subscriptions.schema';
import { InterestService } from './interest/interest.service'
import { IntelligenceService } from './intelligence/intelligence.service'
import { UserService } from '../user/user.service';

interface NotifPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectModel(NotificationSubscription.name)
    private subModel: Model<NotificationSubscriptionDocument>,
    @InjectModel(NotificationDelivery.name)
    private deliveryModel: Model<NotificationDeliveryDocument>,
    private firebaseService: FirebaseService,
    private intelligenceService: IntelligenceService,
    private interestService: InterestService,
    private userService: UserService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'RESTOCK':
        return this.handleRestock(job);
      case 'BUSINESS_OPEN':
        return this.handleBusinessOpen(job);
      case 'REPEATED_SEARCH':
        return this.handleRepeatedSearch(job);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  // ── Type 1: Item back in stock ──────────────────────────────────
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

    // ── Type 5: Repeated search ─────────────────────────────────────
  async handleRepeatedSearch(
    job: Job<{ userId: string; interestId: string }>,
  ) {
    const { userId, interestId } = job.data;

    // Fetch the specific interest this job was enqueued for
    const interest = await this.interestService.findById(interestId);
    if (!interest || interest.score < 3) return;

    // Skip if user converted within the last 7 days
    if (interest.lastConversionAt) {
      const daysSince =
        (Date.now() - interest.lastConversionAt.getTime()) / 86_400_000;
      if (daysSince < 7) return;
    }

    // Find the subscription that matches this exact interest document
    const sub = await this.subModel
      .findOne({
        userId,
        type: 'BEHAVIORAL',
        interestRef: interest._id,
        isActive: true,
      })
      .populate('interestRef');

    if (!sub) return;

    const gate = await this.intelligenceService.evaluate(sub, job);
    if (!gate.send) {
      this.logger.debug(`REPEATED_SEARCH gate blocked: ${gate.reason}`);
      return;
    }

    await this.send(sub, {
      title: 'Still looking? 🔍',
      body: `You searched "${interest.keyword}" multiple times — found nearby!`,
      data: {
        type: 'BEHAVIORAL',
        keyword: interest.keyword,
        businessType: interest.biz_type,
      },
    });
  }

  // ── Shared send helper (used by ALL handlers) ───────────────────
  private async send(sub: any, payload: NotifPayload): Promise<void> {
  const token = await this.userService.getFcmToken(sub.userId.toString());
  if (!token) {
    this.logger.warn(`No FCM token for user ${sub.userId}`);
    return;
  }

  try {
    await this.firebaseService.sendPush({ token, ...payload });
  } catch (err) {
    if (err instanceof StaleFcmTokenError) {
      await this.userService.clearFcmToken(sub.userId.toString());
    }
    return;
  }

  // Everything below: best-effort. Never throw — notification was already sent.
  try {
    await sub.updateOne({
      lastNotifiedAt: new Date(),
      $inc: { notifyCount: 1 },
    });

    const interest = sub.interestRef as any;

    await this.deliveryModel.create({
      subscriptionId: sub._id,
      userId: sub.userId,
      type: sub.type,
      businessId: sub.businessId ?? null,
      itemId: sub.itemId ?? null,
      triggeredAt: new Date(),
      channel: 'FCM',
      status: 'SENT',
      scoreAtSend: interest?.score ?? 0,
      // searchContext — only for BEHAVIORAL
      ...(sub.type === 'BEHAVIORAL' && sub.searchIntent
        ? {
            searchContext: {
              keyword: interest?.keyword ?? '',
              businessType: sub.searchIntent.businessType,
              businessCategory: sub.searchIntent.businessCategory,
              scoreAtTrigger: interest?.score ?? 0,
            },
          }
        : {}),
    });

    const intent = sub.searchIntent;
    if (intent) {
      await this.interestService.record(
        sub.userId.toString(),
        'NOTIFICATION_SENT',
        {
          keyword: intent?.keywords?.[0] ?? '',
          biz_type: intent?.businessType ?? '',
          category: intent?.businessCategory ?? '',
        },
      );
    }
  } catch (err) {
    this.logger.error('Post-send bookkeeping failed (non-critical)', err);
  }
}
}
