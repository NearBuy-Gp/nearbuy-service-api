/**
 * Post-seed verification. Asserts coverage, completeness, geo/items, a working
 * sample search, and the notification surface — then prints a summary with any
 * gaps. Returns ok=false if any hard assertion fails (so CI can gate on it).
 */
import { Model } from 'mongoose';
import { Business } from '../../../modules/business/schemas/buisness.schema';
import { Item } from '../../../modules/item/schemas/item.schema';
import { User } from '../../../modules/user/schemas/user.schema';
import { NotificationSubscription, NotificationType } from '../../../modules/notification/schemas/notification-subscriptions.schema';
import { NotificationDelivery } from '../../../modules/notification/schemas/notifiaction-delivery.schema';
import { UserInterest } from '../../../modules/notification/schemas/user-intrest.schema';
import { ALL_BUSINESS_CATEGORIES, ALL_BUSINESS_TYPES } from './type-plan';
import { SEED_TAG, SEED_EMAIL_DOMAIN, CONSUMER_PREFIX } from './rng';
import { log } from './logger';

export interface VerifyModels {
  businessModel: Model<Business>;
  itemModel: Model<Item>;
  userModel: Model<User>;
  subModel: Model<NotificationSubscription>;
  deliveryModel: Model<NotificationDelivery>;
  interestModel: Model<UserInterest>;
}

const seededBusinessFilter = { 'attributes.seedTag': SEED_TAG };

export async function verify(m: VerifyModels, minPerType: number): Promise<boolean> {
  log.phase('Verification');
  const checks: { label: string; ok: boolean; detail?: string }[] = [];

  // Load all v2 businesses ONCE and scope every downstream query by their ids,
  // so we never count leftover combined-seed data (which also uses "Seed " names).
  const businesses = await m.businessModel.find(seededBusinessFilter).select('_id type category location name address ownerId').lean();
  const v2Ids = businesses.map((b) => b._id);
  const v2ItemFilter = { businessId: { $in: v2Ids } };
  log.step(`Scoped to ${businesses.length} v2 businesses (attributes.seedTag="${SEED_TAG}").`);

  // 1. Coverage per type
  const typeMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const b of businesses) {
    typeMap.set(b.type, (typeMap.get(b.type) ?? 0) + 1);
    catMap.set(b.category, (catMap.get(b.category) ?? 0) + 1);
  }
  const typeGaps = ALL_BUSINESS_TYPES.filter((t) => (typeMap.get(t) ?? 0) < minPerType);
  checks.push({ label: `≥${minPerType} businesses for all ${ALL_BUSINESS_TYPES.length} types`, ok: typeGaps.length === 0, detail: typeGaps.length ? `gaps: ${typeGaps.join(', ')}` : `all ${ALL_BUSINESS_TYPES.length} covered` });

  // 2. Coverage per category
  const catGaps = ALL_BUSINESS_CATEGORIES.filter((c) => (catMap.get(c) ?? 0) < minPerType);
  checks.push({ label: `≥${minPerType} businesses for all ${ALL_BUSINESS_CATEGORIES.length} categories`, ok: catGaps.length === 0, detail: catGaps.length ? `gaps: ${catGaps.join(', ')}` : `all covered (${ALL_BUSINESS_CATEGORIES.map((c) => `${c}:${catMap.get(c) ?? 0}`).join(', ')})` });

  // 3. No required field null on businesses
  const badBiz = await m.businessModel.countDocuments({
    ...seededBusinessFilter,
    $or: [{ name: { $in: [null, ''] } }, { address: { $in: [null, ''] } }, { type: null }, { category: null }, { ownerId: null }, { 'location.coordinates': { $size: 0 } }],
  });
  checks.push({ label: 'No business missing required fields', ok: badBiz === 0, detail: badBiz ? `${badBiz} invalid` : `${businesses.length} clean` });

  // 4. Every business has valid coords + ≥1 item
  let noItems = 0;
  let badCoords = 0;
  for (const b of businesses) {
    const coords = (b as any).location?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2 || coords.some((n: any) => typeof n !== 'number')) badCoords += 1;
    const itemCount = await m.itemModel.countDocuments({ businessId: b._id });
    if (itemCount === 0) noItems += 1;
  }
  checks.push({ label: 'Every business has valid lat/lng', ok: badCoords === 0, detail: badCoords ? `${badCoords} bad` : 'all valid' });
  checks.push({ label: 'Every business has ≥1 item', ok: noItems === 0, detail: noItems ? `${noItems} empty` : 'all have items' });

  // 5. Items: required fields + embedding coverage (scoped to v2 businesses)
  const totalItems = await m.itemModel.countDocuments(v2ItemFilter);
  const [noName, noBiz, noCat, noType] = await Promise.all([
    m.itemModel.countDocuments({ ...v2ItemFilter, name: { $in: [null, ''] } }),
    m.itemModel.countDocuments({ ...v2ItemFilter, businessId: null }),
    m.itemModel.countDocuments({ ...v2ItemFilter, categoryId: null }),
    m.itemModel.countDocuments({ ...v2ItemFilter, type: null }),
  ]);
  const badItems = await m.itemModel.countDocuments({ ...v2ItemFilter, $or: [{ name: { $in: [null, ''] } }, { businessId: null }, { categoryId: null }, { type: null }] });
  const embedded = await m.itemModel.countDocuments({ ...v2ItemFilter, embedding: { $size: 384 } });
  checks.push({ label: 'No item missing required fields', ok: badItems === 0, detail: badItems ? `${badItems} invalid (name:${noName}, businessId:${noBiz}, categoryId:${noCat}, type:${noType})` : `${totalItems} items clean` });
  checks.push({ label: 'Embedding coverage', ok: true, detail: `${embedded}/${totalItems} items have 384-dim embeddings${embedded === 0 ? ' (NLP service unreachable or --no-embeddings)' : ''}` });

  // 6. Sample search (deterministic, non-vector) — proves data is queryable
  const sampleType = ALL_BUSINESS_TYPES.find((t) => (typeMap.get(t) ?? 0) > 0);
  let searchHits = 0;
  if (sampleType) {
    searchHits = await m.itemModel.countDocuments({ ...v2ItemFilter, businessType: sampleType });
  }
  checks.push({
    label: 'Sample search returns seeded results',
    ok: searchHits > 0,
    detail: `query businessType="${sampleType}" → ${searchHits} items. (Full semantic vector search additionally requires an Atlas "vector_index" on items.embedding.)`,
  });

  // 7. Notifications
  const consumers = await m.userModel.find({ email: { $regex: `^${CONSUMER_PREFIX}.*@${SEED_EMAIL_DOMAIN}$` } }).select('_id').lean();
  let consumersOk = 0;
  for (const c of consumers) {
    const [ints, subs, dels] = await Promise.all([m.interestModel.countDocuments({ userId: c._id }), m.subModel.countDocuments({ userId: c._id }), m.deliveryModel.countDocuments({ userId: c._id })]);
    if (ints >= 1 && subs >= 1 && dels >= 1) consumersOk += 1;
  }
  checks.push({ label: 'Every consumer has interests + subscription + delivery', ok: consumers.length > 0 && consumersOk === consumers.length, detail: `${consumersOk}/${consumers.length} consumers complete` });

  const subTypes = (await m.subModel.distinct('type')) as string[];
  const allTypesPresent = Object.values(NotificationType).every((t) => subTypes.includes(t));
  checks.push({ label: 'All 4 notification types represented', ok: allTypesPresent, detail: `present: ${subTypes.join(', ') || 'none'}` });

  const delStatuses = (await m.deliveryModel.distinct('status')) as string[];
  const allStatuses = ['SENT', 'READ', 'DISMISSED', 'FAILED'].every((s) => delStatuses.includes(s));
  checks.push({ label: 'All delivery statuses represented', ok: allStatuses, detail: `present: ${delStatuses.join(', ') || 'none'}` });

  // --- Print report ---
  console.log('\n┌─ Verification Report ─────────────────────────────');
  let allOk = true;
  for (const c of checks) {
    const mark = c.ok ? '✅' : '❌';
    if (!c.ok) allOk = false;
    console.log(`│ ${mark} ${c.label}${c.detail ? `\n│      ↳ ${c.detail}` : ''}`);
  }
  console.log('└───────────────────────────────────────────────────');
  console.log(allOk ? '🎉 All verification checks passed.' : '⚠️  Some checks failed — see gaps above.');
  return allOk;
}
