/**
 * Resolves location names to coordinates via the app's existing Nominatim
 * helper (`getCoordinates`) — never reimplemented — and scatters businesses
 * around each resolved center with small randomized offsets. Geohashes are
 * produced with `ngeohash`, matching the precision tiers used app-wide.
 */
import * as ngeohash from 'ngeohash';
import { getCoordinates } from '../../../modules/search/utils/geo-get-coordinates';
import { faker } from './rng';
import { log } from './logger';

export interface GeoCenter {
  name: string;
  /** GeoJSON order: [lng, lat]. */
  coordinates: [number, number];
}

const SCATTER_RADIUS_M = 6000;

/** Resolve every requested location; fall back to Cairo center on failure. */
export async function resolveCenters(locations: string[]): Promise<GeoCenter[]> {
  const centers: GeoCenter[] = [];
  for (const name of locations) {
    try {
      const coordinates = await getCoordinates(name);
      centers.push({ name, coordinates });
      log.step(`Geocoded "${name}" → [lng ${coordinates[0].toFixed(5)}, lat ${coordinates[1].toFixed(5)}]`);
    } catch (err) {
      log.warn(`Could not geocode "${name}" (${(err as Error).message}); using Cairo fallback.`);
      centers.push({ name: `${name} (fallback)`, coordinates: [31.024917, 29.95556] });
    }
  }
  if (centers.length === 0) {
    centers.push({ name: 'Cairo (default)', coordinates: [31.024917, 29.95556] });
  }
  return centers;
}

/** Random point within `radiusInMeters` of the center. Returns [lng, lat]. */
export function scatterPoint(center: [number, number], radiusInMeters = SCATTER_RADIUS_M): [number, number] {
  const [centerLng, centerLat] = center;
  const radiusInDegrees = radiusInMeters / 111000;
  const u = faker.number.float({ min: 0, max: 1 });
  const v = faker.number.float({ min: 0, max: 1 });
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  const newLat = centerLat + y;
  const newLng = centerLng + x / Math.cos(centerLat * (Math.PI / 180));
  return [newLng, newLat];
}

/** Multi-precision geohash tiers, same shape as the app's combined-seed. */
export function buildGeohashes(lng: number, lat: number) {
  const hash = ngeohash.encode(lat, lng);
  return {
    geohash: hash,
    geohash_country: hash.substring(0, 2),
    geohash_region: hash.substring(0, 3),
    geohash_city: hash.substring(0, 4),
    geohash_district: hash.substring(0, 5),
    geohash_neighborhood: hash.substring(0, 6),
    geohash_street: hash.substring(0, 7),
    geohash_building: hash.substring(0, 8),
  };
}
