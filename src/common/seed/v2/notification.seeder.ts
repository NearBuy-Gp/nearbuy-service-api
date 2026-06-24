/**
 * Notification surface seeding. Per consumer it creates:
 *   - UserInterest rows (realistic score/searchHistory/peaks/conversions),
 *   - NotificationSubscription rows covering ALL 4 types (RESTOCK, BUSINESS_OPEN,
 *     PROXIMITY, BEHAVIORAL),
 *   - NotificationDelivery rows covering ALL statuses (SENT/READ/DISMISSED/FAILED)
 *     and both channels (FCM/LOCAL).
 * Subscriptions/interests upsert by natural key; deliveries are cleared per
 * consumer (seeded-only) then reinserted to stay idempotent.
 */
import { Model, Types } from 'mongoose';
import { NotificationSubscription, NotificationType } from '../../../modules/notification/schemas/notification-subscriptions.schema';
import { NotificationDelivery } from '../../../modules/notification/schemas/notifiaction-delivery.schema';
import { UserInterest } from '../../../modules/notification/schemas/user-intrest.schema';
import { BusinessSeed } from './business.seeder';
import { SeededItem } from './item.seeder';
import { faker } from './rng';

export interface NotificationModels {
  subModel: Model<NotificationSubscription>;
  deliveryModel: Model<NotificationDelivery>;
  interestModel: Model<UserInterest>;
}

const DELIVERY_STATUSES = ['SENT', 'READ', 'DISMISSED', 'FAILED'];
const CHANNELS = ['FCM', 'LOCAL'];

function searchHistory() {
  const n = faker.number.int({ min: 3, max: 12 });
  return Array.from({ length: n }, () => {
    const d = faker.date.recent({ days: 21 });
    return { searchedAt: d, hour: d.getHours(), dayOfWeek: d.getDay() };
  });
}

export interface ConsumerNotifResult {
  interests: number;
  subscriptions: number;
  deliveries: number;
}

export async function seedNotificationsForConsumer(
  models: NotificationModels,
  userId: Types.ObjectId,
  consumerIndex: number,
  businesses: BusinessSeed[],
  items: SeededItem[],
): Promise<ConsumerNotifResult> {
  const { subModel, deliveryModel, interestModel } = models;
  const result: ConsumerNotifResult = { interests: 0, subscriptions: 0, deliveries: 0 };

  // Distinct business types this consumer is interested in.
  const interestBusinesses = faker.helpers.arrayElements(businesses, faker.number.int({ min: 2, max: Math.min(4, businesses.length) }));
  const seenTypes = new Set<string>();
  const interestRefs: { id: Types.ObjectId; business: BusinessSeed; keyword: string }[] = [];

  for (const biz of interestBusinesses) {
    if (seenTypes.has(biz.type)) continue;
    seenTypes.add(biz.type);
    const keyword = biz.tags?.[0] ?? biz.type.replace(/_/g, ' ');
    const hist = searchHistory();
    // Some interests cross the score>=3 behavioral threshold, some don't.
    const score = faker.number.int({ min: 1, max: 9 });
    const converted = faker.datatype.boolean(0.3);
    const doc = await interestModel.findOneAndUpdate(
      { userId, biz_type: biz.type },
      {
        $set: {
          keyword,
          category: biz.category,
          score,
          rawScore: score + faker.number.int({ min: 0, max: 5 }),
          lastUpdated: new Date(),
          lastDecayApplied: faker.date.recent({ days: 7 }),
          searchHistory: hist,
          peakSearchHour: faker.number.int({ min: 7, max: 22 }),
          peakSearchDay: faker.number.int({ min: 0, max: 6 }),
          lastConversionAt: converted ? faker.date.recent({ days: 14 }) : null,
          conversionCount: converted ? faker.number.int({ min: 1, max: 3 }) : 0,
        },
        $setOnInsert: { userId, biz_type: biz.type },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    interestRefs.push({ id: doc._id as Types.ObjectId, business: biz, keyword });
    result.interests += 1;
  }

  if (interestRefs.length === 0) return result;

  const primary = interestRefs[0];
  const restockItem = items.find((it) => String(it.business._id) === String(primary.business._id)) ?? items[0];

  // --- Subscriptions: one of every type ---
  const subIds: { id: Types.ObjectId; type: NotificationType }[] = [];

  // RESTOCK (needs item)
  if (restockItem) {
    const s = await subModel.findOneAndUpdate(
      { userId, type: NotificationType.RESTOCK, itemId: restockItem._id },
      {
        $set: { businessId: restockItem.business._id, isActive: true, geofence: { radiusMeters: 300 } },
        $setOnInsert: { userId, type: NotificationType.RESTOCK, itemId: restockItem._id, notifyCount: faker.number.int({ min: 0, max: 3 }) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subIds.push({ id: s._id as Types.ObjectId, type: NotificationType.RESTOCK });
  }

  // BUSINESS_OPEN (needs business)
  {
    const s = await subModel.findOneAndUpdate(
      { userId, type: NotificationType.BUSINESS_OPEN, businessId: primary.business._id },
      {
        $set: { isActive: true, geofence: { radiusMeters: 300 } },
        $setOnInsert: { userId, type: NotificationType.BUSINESS_OPEN, businessId: primary.business._id, notifyCount: faker.number.int({ min: 0, max: 5 }) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subIds.push({ id: s._id as Types.ObjectId, type: NotificationType.BUSINESS_OPEN });
  }

  // PROXIMITY & BEHAVIORAL (search intent)
  for (const type of [NotificationType.PROXIMITY, NotificationType.BEHAVIORAL]) {
    const ref = type === NotificationType.BEHAVIORAL ? primary : interestRefs[interestRefs.length - 1];
    const searchIntent = {
      businessType: ref.business.type,
      businessCategory: ref.business.category,
      searchVector: [],
      keywords: [ref.keyword, ref.business.category],
      original_query: `${ref.keyword} near me`,
      modifiers: { is_cheap: faker.datatype.boolean(), rating_min: faker.number.int({ min: 0, max: 4 }) },
    };
    const set: Record<string, unknown> = { isActive: true, searchIntent, geofence: { radiusMeters: faker.helpers.arrayElement([300, 500, 1000]) } };
    if (type === NotificationType.BEHAVIORAL) set.interestRef = ref.id;
    const s = await subModel.findOneAndUpdate(
      { userId, type, 'searchIntent.businessType': ref.business.type },
      { $set: set, $setOnInsert: { userId, type, notifyCount: faker.number.int({ min: 0, max: 4 }) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subIds.push({ id: s._id as Types.ObjectId, type });
  }

  result.subscriptions = subIds.length;

  // --- Deliveries: clear seeded-only then insert, cover all statuses/channels ---
  await deliveryModel.deleteMany({ userId });
  const deliveries = subIds.map((sub, i) => {
    const status = DELIVERY_STATUSES[(consumerIndex + i) % DELIVERY_STATUSES.length];
    const channel = CHANNELS[(consumerIndex + i) % CHANNELS.length];
    const base: Record<string, unknown> = {
      subscriptionId: sub.id,
      userId,
      type: sub.type,
      triggeredAt: faker.date.recent({ days: 20 }),
      channel,
      status,
      scoreAtSend: faker.number.int({ min: 1, max: 9 }),
    };
    if (sub.type === NotificationType.RESTOCK && restockItem) {
      base.businessId = restockItem.business._id;
      base.itemId = restockItem._id;
    } else if (sub.type === NotificationType.BUSINESS_OPEN) {
      base.businessId = primary.business._id;
    } else if (sub.type === NotificationType.BEHAVIORAL) {
      base.searchContext = {
        keyword: primary.keyword,
        businessType: primary.business.type,
        businessCategory: primary.business.category,
        scoreAtTrigger: faker.number.int({ min: 3, max: 9 }),
      };
    }
    return base;
  });
  // Add an extra FAILED/LOCAL delivery to guarantee coverage on every consumer.
  deliveries.push({
    subscriptionId: subIds[0].id,
    userId,
    type: subIds[0].type,
    triggeredAt: faker.date.recent({ days: 20 }),
    channel: 'LOCAL',
    status: 'FAILED',
    scoreAtSend: faker.number.int({ min: 1, max: 4 }),
  });

  const inserted = await deliveryModel.insertMany(deliveries);
  result.deliveries = inserted.length;

  return result;
}
