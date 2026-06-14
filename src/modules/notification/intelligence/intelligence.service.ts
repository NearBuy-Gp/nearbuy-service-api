import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import {
  NotificationSubscription,
  NotificationSubscriptionDocument,
} from '../schemas/notification-subscriptions.schema';
import { UserInterest, UserInterestDocument } from '../schemas/user-intrest.schema';

const THRESHOLDS: Record<string, number> = {
  PROXIMITY:   3,
  BEHAVIORAL:  3,
  TRENDING:    4,
  TIME_AWARE:  3,
};

const BASE_COOLDOWN_HOURS: Record<string, number> = {
  RESTOCK:        24,
  BUSINESS_OPEN:  4,
  PROXIMITY:      6,
  BEHAVIORAL:     12,
  TRENDING:       24,
  TIME_AWARE:     48,
};

function getAdjustedCooldown(type: string, score: number): number {
  const base = BASE_COOLDOWN_HOURS[type] ?? 12;
  if (score >= 8) return base * 0.4;
  if (score >= 5) return base * 0.7;
  if (score >= 3) return base;
  return base * 2;
}

function getMsUntilHour(targetHour: number, timeZone: string): number {
  const now = new Date();
  const cairoNow = new Date(
    now.toLocaleString('en-US', { timeZone }),
  );
  const next = new Date(cairoNow);
  next.setHours(targetHour, 0, 0, 0);
  if (next <= cairoNow) next.setDate(next.getDate() + 1);
  return next.getTime() - cairoNow.getTime();
}

export interface GateResult {
  send: boolean;
  reason?: string;
}

@Injectable()
export class IntelligenceService {
  constructor(
    @InjectModel(UserInterest.name)
    private readonly interestModel: Model<UserInterestDocument>,
    @InjectQueue('notifications')
    private readonly notifQueue: Queue,
  ) {}

  async evaluate(
    sub: NotificationSubscriptionDocument,
    job?: { moveToDelayed: (timestamp: number) => Promise<void> },
  ): Promise<GateResult> {
    const interest = sub.interestRef
      ? await this.interestModel.findById(sub.interestRef)
      : null;

    // C1 — Score threshold (explicit types bypass)
    if (!['RESTOCK', 'BUSINESS_OPEN'].includes(sub.type)) {
      const threshold = THRESHOLDS[sub.type] ?? 3;
      if (!interest || interest.score < threshold) {
        return { send: false, reason: 'SCORE_TOO_LOW' };
      }
    }

    // C2 — Frequency-weighted cooldown
    if (sub.lastNotifiedAt) {
      const hoursSinceLast =
        (Date.now() - sub.lastNotifiedAt.getTime()) / 3_600_000;
      const adjusted = getAdjustedCooldown(sub.type, interest?.score ?? 0);
      if (hoursSinceLast < adjusted) {
        return { send: false, reason: 'COOLDOWN' };
      }
    }

    // C3 — Quiet hours (8 AM–10 PM Cairo UTC+2)
    const cairoHour = parseInt(
      new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        hour: 'numeric',
        hour12: false,
      }),
      10,
    );
    if (cairoHour < 8 || cairoHour >= 22) {
      if (job) {
        const delay = getMsUntilHour(8, 'Africa/Cairo');
        await job.moveToDelayed(Date.now() + delay);
      }
      return { send: false, reason: 'QUIET_HOURS' };
    }

    // C4 — Already converted since last notification
    if (
      interest?.lastConversionAt &&
      sub.lastNotifiedAt &&
      interest.lastConversionAt > sub.lastNotifiedAt
    ) {
      return { send: false, reason: 'ALREADY_CONVERTED' };
    }

    // C5 — Snooze
    if (sub.snoozedUntil && sub.snoozedUntil > new Date()) {
      return { send: false, reason: 'SNOOZED' };
    }

    // C6 — User preference (delegated to caller via NotificationService)
    return { send: true };
  }
}