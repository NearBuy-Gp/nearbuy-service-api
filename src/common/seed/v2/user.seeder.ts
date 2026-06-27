/**
 * Owner & consumer user seeding.
 *
 * - One OWNER per business (enforces the one-user-one-business rule the schema
 *   does not enforce). Owners are upserted by their deterministic seed email.
 * - A pool of CONSUMER (role=user) accounts that own interests/notifications.
 * All user fields are populated (userName, email, password hash, role, fcmToken,
 * bookmarkedBusinesses).
 */
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User } from '../../../modules/user/schemas/user.schema';
import { Role } from '../../../utils/enums/user-role.enum';
import { faker, OWNER_PREFIX, CONSUMER_PREFIX, SEED_EMAIL_DOMAIN } from './rng';

// Pre-hash one password (bcrypt is slow); every seeded account shares it.
let cachedHash: string | null = null;
async function seedPasswordHash(): Promise<string> {
  if (!cachedHash) {
    cachedHash = await bcrypt.hash('Seeded#Pass123', 10);
  }
  return cachedHash;
}

export function ownerEmail(typeKey: string, index: number): string {
  return `${OWNER_PREFIX}${typeKey}_${index}@${SEED_EMAIL_DOMAIN}`;
}

export function consumerEmail(index: number): string {
  return `${CONSUMER_PREFIX}${index}@${SEED_EMAIL_DOMAIN}`;
}

/** Upsert an owner for a given (typeKey,index) and return its _id. */
export async function upsertOwner(userModel: Model<User>, typeKey: string, index: number): Promise<Types.ObjectId> {
  const email = ownerEmail(typeKey, index);
  const password = await seedPasswordHash();
  const doc = await userModel.findOneAndUpdate(
    { email },
    {
      $set: {
        userName: faker.person.fullName(),
        role: Role.OWNER,
        fcmToken: `seed-fcm-${faker.string.alphanumeric(24)}`,
      },
      $setOnInsert: { email, password },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc._id as Types.ObjectId;
}

/** Upsert the consumer pool; returns their ids. */
export async function upsertConsumers(userModel: Model<User>, count: number, businessIds: Types.ObjectId[]): Promise<Types.ObjectId[]> {
  const password = await seedPasswordHash();
  const ids: Types.ObjectId[] = [];
  for (let i = 0; i < count; i++) {
    const email = consumerEmail(i);
    const bookmarks = businessIds.length > 0 ? faker.helpers.arrayElements(businessIds, faker.number.int({ min: 0, max: Math.min(4, businessIds.length) })) : [];
    const doc = await userModel.findOneAndUpdate(
      { email },
      {
        $set: {
          userName: faker.person.fullName(),
          role: Role.USER,
          fcmToken: `seed-fcm-${faker.string.alphanumeric(24)}`,
          bookmarkedBusinesses: bookmarks,
        },
        $setOnInsert: { email, password },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    ids.push(doc._id as Types.ObjectId);
  }
  return ids;
}
