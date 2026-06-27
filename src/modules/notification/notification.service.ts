import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationSubscription } from './schemas/notification-subscriptions.schema';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationSubscription.name)
    private subModel: Model<NotificationSubscription>,
  ) {}

  public async subscribe(userId: string, dto: SubscribeDto): Promise<NotificationSubscription> {
    const existing = await this.subModel.findOne({
      userId,
      type: dto.type,
      ...(dto.itemId && { itemId: dto.itemId }),
      ...(dto.businessId && { businessId: dto.businessId }),
    });

    if (existing) {
      existing.set({ isActive: true, snoozedUntil: null });
      return existing.save();
    }

    return this.subModel.create({
      userId: new Types.ObjectId(userId),
      type: dto.type,
      businessId: dto.businessId ? new Types.ObjectId(dto.businessId) : undefined,
      itemId: dto.itemId ? new Types.ObjectId(dto.itemId) : undefined,
      isActive: true,
      notifyCount: 0,
      geofence: { radiusMeters: 300 },
    });
  }

  async unsubscribe(userId: string, dto: SubscribeDto): Promise<void> {
    await this.subModel.updateOne(
      {
        userId,
        type: dto.type,
        ...(dto.itemId && { itemId: dto.itemId }),
        ...(dto.businessId && { businessId: dto.businessId }),
      },
      { isActive: false },
    );
  }

  async isSubscribed(userId: string, dto: SubscribeDto): Promise<boolean> {
    const sub = await this.subModel.findOne({
      userId,
      type: dto.type,
      isActive: true,
      ...(dto.itemId && { itemId: dto.itemId }),
      ...(dto.businessId && { businessId: dto.businessId }),
    });
    return !!sub;
  }

  async snooze(userId: string, subscriptionId: string, hours: number): Promise<void> {
    const snoozedUntil = new Date(Date.now() + hours * 3600000);
    const result = await this.subModel.updateOne({ _id: subscriptionId, userId }, { snoozedUntil });
    if (result.matchedCount === 0) throw new NotFoundException('Subscription not found');
  }
}
