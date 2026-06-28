/**
 * Builds and upserts a fully-populated Business (every field set, varied across
 * instances). Upsert key is `ownerId` (one business per owner).
 */
import { Model, Types } from 'mongoose';
import { Business } from '../../../modules/business/schemas/buisness.schema';
import { BusinessType } from '../../../modules/business/enums/business-type.enum';
import { BusinessCategory } from '../../../modules/business/enums/business-category.enum';
import { BusinessStatus } from '../../../modules/business/enums/business-status.enum';
import { BusinessFacility } from '../../../modules/business/enums/business-facilities.enum';
import { BusinessMainItem } from '../../../modules/business/enums/business-mainitems.enum';
import { BusinessTargetAudience } from '../../../modules/business/enums/business-target-audience';
import { WeekDays } from '../../../utils/enums/week-days.enum';
import { faker, pickSome, SEED_TAG, BUSINESS_PREFIX } from './rng';
import { buildGeohashes, scatterPoint } from './geo.seeder';
import { cairoAddress, egyptianPhone } from './egypt';

const ALL_FACILITIES = Object.values(BusinessFacility);
const ALL_MAIN_ITEMS = Object.values(BusinessMainItem);
const ALL_AUDIENCES = Object.values(BusinessTargetAudience);
const WEEK = Object.values(WeekDays);

function workingHours() {
  return WEEK.map((day) => {
    const closed = day === WeekDays.FRIDAY ? faker.datatype.boolean(0.3) : faker.datatype.boolean(0.1);
    return closed
      ? { day, isClosed: true }
      : {
          day,
          From: faker.helpers.arrayElement(['08:00', '09:00', '10:00', '11:00']),
          to: faker.helpers.arrayElement(['20:00', '21:00', '22:00', '23:00']),
          isClosed: false,
        };
  });
}

function socialLinks(slug: string) {
  return {
    facebook: `https://facebook.com/${slug}`,
    instagram: `https://instagram.com/${slug}`,
    tiktok: `https://tiktok.com/@${slug}`,
    twitter: `https://twitter.com/${slug}`,
    linkedin: `https://linkedin.com/company/${slug}`,
  };
}

export interface BusinessSeed {
  _id: Types.ObjectId;
  name: string;
  category: BusinessCategory;
  type: BusinessType;
  description: string;
  tags: string[];
  location: { type: 'Point'; coordinates: [number, number] };
  rate: number;
  workingHours: any[];
}

export interface BusinessContent {
  name: string;
  description: string;
  tags: string[];
}

export async function upsertBusiness(
  businessModel: Model<Business>,
  params: {
    ownerId: Types.ObjectId;
    type: BusinessType;
    category: BusinessCategory;
    index: number;
    center: [number, number];
    content: BusinessContent;
  },
): Promise<BusinessSeed> {
  const { ownerId, type, category, index, center, content } = params;
  const coordinates = scatterPoint(center);
  const [lng, lat] = coordinates;
  const slug = `${type}-${index}-${faker.string.alphanumeric(4).toLowerCase()}`;
  const name = `${BUSINESS_PREFIX} ${content.name} #${index + 1}`;
  const rate = Number((3.2 + faker.number.float({ min: 0, max: 1.8 })).toFixed(1));
  const numberOfRatings = faker.number.int({ min: 8, max: 600 });
  const isOpen = faker.datatype.boolean(0.7);

  const doc = await businessModel.findOneAndUpdate(
    { ownerId },
    {
      $set: {
        name,
        description: content.description,
        category,
        type,
        tags: content.tags,
        subcategory: type.replace(/_/g, ' '),
        phone: egyptianPhone(),
        email: faker.internet.email({ provider: 'nearbuy.seed' }).toLowerCase(),
        website: `https://${slug}.example.com`,
        whatsappNumber: egyptianPhone(),
        social: socialLinks(slug),
        address: cairoAddress(),
        location: { type: 'Point', coordinates },
        workingHours: workingHours(),
        images: [faker.image.url({ width: 1200, height: 800 }), faker.image.url({ width: 1200, height: 800 })],
        status: faker.helpers.arrayElement([BusinessStatus.OPEN, BusinessStatus.OPEN, BusinessStatus.CLOSED, BusinessStatus.TEMPORARILY_CLOSED]),
        rate,
        numberOfRatings,
        ratings: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
          userId: new Types.ObjectId(),
          rate: faker.number.int({ min: 3, max: 5 }),
        })),
        targetAudience: pickSome(ALL_AUDIENCES, faker.number.int({ min: 1, max: 3 })),
        mainItems: pickSome(ALL_MAIN_ITEMS, faker.number.int({ min: 2, max: 5 })),
        facilities: pickSome(ALL_FACILITIES, faker.number.int({ min: 3, max: 7 })),
        targetAudienceOther: [faker.word.adjective(), faker.word.noun()],
        mainItemsOthers: [faker.commerce.product()],
        is_open_now: isOpen,
        lastOpenedAt: faker.date.recent({ days: 7 }),
        attributes: { seedTag: SEED_TAG, sourceType: type, instance: index + 1 },
        ...buildGeohashes(lng, lat),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    _id: doc._id as Types.ObjectId,
    name: doc.name,
    category: doc.category,
    type: doc.type,
    description: doc.description ?? content.description,
    tags: doc.tags ?? content.tags,
    location: doc.location,
    rate: doc.rate,
    workingHours: (doc.workingHours as any[]) ?? [],
  };
}
