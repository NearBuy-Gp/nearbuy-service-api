/**
 * `--fresh` cleanup: deletes ONLY seeded-tagged records, in FK-safe order, and
 * never truncates a whole collection. Seeded records are identified by the seed
 * email domain (users), the `attributes.seedTag` marker / "Seed " name prefix
 * (businesses), and ownership/denormalized links (items, notifications).
 */
import { Model } from 'mongoose';
import { User } from '../../../modules/user/schemas/user.schema';
import { Business } from '../../../modules/business/schemas/buisness.schema';
import { Item } from '../../../modules/item/schemas/item.schema';
import { NotificationSubscription } from '../../../modules/notification/schemas/notification-subscriptions.schema';
import { NotificationDelivery } from '../../../modules/notification/schemas/notifiaction-delivery.schema';
import { UserInterest } from '../../../modules/notification/schemas/user-intrest.schema';
import { SEED_TAG, SEED_EMAIL_DOMAIN } from './rng';
import { log } from './logger';

export interface CleanupModels {
  userModel: Model<User>;
  businessModel: Model<Business>;
  itemModel: Model<Item>;
  subModel: Model<NotificationSubscription>;
  deliveryModel: Model<NotificationDelivery>;
  interestModel: Model<UserInterest>;
}

/**
 * Deletes ONLY v2-seeded records — identified by the seed email domain (users)
 * and the `attributes.seedTag` marker / seed-owner ownership (businesses & their
 * items). It deliberately does NOT match on the "Seed " name prefix, so legacy
 * combined-seed data and any real data are never touched.
 */
export async function freshCleanup(m: CleanupModels): Promise<void> {
  const emailFilter = { email: { $regex: `@${SEED_EMAIL_DOMAIN}$` } };
  const seededUsers = await m.userModel.find(emailFilter).select('_id').lean();
  const userIds = seededUsers.map((u) => u._id);

  const seededBusinesses = await m.businessModel
    .find({ $or: [{ 'attributes.seedTag': SEED_TAG }, { ownerId: { $in: userIds } }] })
    .select('_id')
    .lean();
  const businessIds = seededBusinesses.map((b) => b._id);

  const delDeliveries = await m.deliveryModel.deleteMany({ userId: { $in: userIds } });
  const delSubs = await m.subModel.deleteMany({ userId: { $in: userIds } });
  const delInterests = await m.interestModel.deleteMany({ userId: { $in: userIds } });
  const delItems = await m.itemModel.deleteMany({ businessId: { $in: businessIds } });
  const delBiz = await m.businessModel.deleteMany({ _id: { $in: businessIds } });
  const delUsers = await m.userModel.deleteMany({ _id: { $in: userIds } });

  log.ok(
    `Fresh cleanup removed: ${delUsers.deletedCount} users, ${delBiz.deletedCount} businesses, ${delItems.deletedCount} items, ` +
      `${delInterests.deletedCount} interests, ${delSubs.deletedCount} subscriptions, ${delDeliveries.deletedCount} deliveries.`,
  );
}
