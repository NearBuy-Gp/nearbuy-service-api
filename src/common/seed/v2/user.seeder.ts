/**
 * Owner & consumer user seeding — EGYPT-localized profiles.
 *
 * - One OWNER per business (enforces the one-user-one-business rule the schema
 *   does not enforce). Owners are upserted by their deterministic seed email and
 *   carry the "Business Owner" userType.
 * - A pool of CONSUMER (role=user) accounts that own interests/notifications,
 *   with varied Egyptian buyer personas (Student / Employee / Parent / …),
 *   realistic local mobile numbers, ages and shopping interests.
 *
 * All people fields are populated (userName, email, password hash, role,
 * phoneNumber, age, userType, interests, fcmToken, bookmarkedBusinesses).
 */
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User } from '../../../modules/user/schemas/user.schema';
import { Role } from '../../../utils/enums/user-role.enum';
import { faker, OWNER_PREFIX, CONSUMER_PREFIX, SEED_EMAIL_DOMAIN } from './rng';
import { egyptianFullName, egyptianPhone } from './egypt';

// Schema-allowed enum values (mirror user.schema.ts to stay schema-valid).
const CONSUMER_USER_TYPES = ['Student', 'Employee', 'Professional', 'Parent', 'Tourist', 'Freelancer'];
const ALL_INTERESTS = ['Food', 'Shopping', 'Electronics', 'Fashion', 'Entertainment', 'Sports', 'Services', 'Healthcare'];

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
        userName: egyptianFullName(),
        role: Role.OWNER,
        userType: 'Business Owner',
        phoneNumber: egyptianPhone(),
        age: faker.number.int({ min: 24, max: 60 }),
        // Owners care about the categories adjacent to what they sell.
        interests: faker.helpers.arrayElements(ALL_INTERESTS, faker.number.int({ min: 1, max: 3 })),
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
    const userType = faker.helpers.arrayElement(CONSUMER_USER_TYPES);
    // Tourists skew younger/older mixed; students 18-25; everyone else broad.
    const age = userType === 'Student' ? faker.number.int({ min: 18, max: 25 }) : faker.number.int({ min: 22, max: 65 });
    const doc = await userModel.findOneAndUpdate(
      { email },
      {
        $set: {
          userName: egyptianFullName(),
          role: Role.USER,
          userType,
          age,
          phoneNumber: egyptianPhone(),
          interests: faker.helpers.arrayElements(ALL_INTERESTS, faker.number.int({ min: 1, max: 4 })),
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
