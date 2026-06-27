/* Seeded faker instance + small deterministic helpers shared across seeders. */
import { faker } from '@faker-js/faker';
import { SeederConfig } from './config';

export function initRng(cfg: SeederConfig): void {
  if (!cfg.randomize) {
    faker.seed(cfg.seed);
  }
}

export { faker };

/** Pick `n` distinct random elements from `arr` (or all if n >= length). */
export function pickSome<T>(arr: readonly T[], n: number): T[] {
  if (n >= arr.length) return [...arr];
  return faker.helpers.arrayElements([...arr], n);
}

/** Slight numeric jitter so the N instances of a (type) are not clones. */
export function jitterPrice(base: number): number {
  const factor = faker.number.float({ min: 0.85, max: 1.2, fractionDigits: 2 });
  const value = Math.max(1, Math.round(base * factor));
  return value;
}

/** Stable, FK/identity-safe tag carried by every seeded record. */
export const SEED_TAG = 'nb-seed-v2';
export const SEED_EMAIL_DOMAIN = 'nearbuy.seed';
export const OWNER_PREFIX = 'seeded_owner_';
export const CONSUMER_PREFIX = 'seeded_user_';
export const BUSINESS_PREFIX = 'Seed';
