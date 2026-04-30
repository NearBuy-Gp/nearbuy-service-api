import geohash from 'ngeohash';

const GEOGRAPHIC_LEVELS = {
  COUNTRY: { precision: 2, field: 'geohash_country', minZoom: 0, maxZoom: 3 },
  REGION: { precision: 3, field: 'geohash_region', minZoom: 4, maxZoom: 6 },
  CITY: { precision: 4, field: 'geohash_city', minZoom: 7, maxZoom: 9 },
  DISTRICT: { precision: 5, field: 'geohash_district', minZoom: 10, maxZoom: 11 },
  NEIGHBORHOOD: { precision: 6, field: 'geohash_neighborhood', minZoom: 12, maxZoom: 13 },
  STREET: { precision: 7, field: 'geohash_street', minZoom: 14, maxZoom: 15 },
  BUILDING: { precision: 8, field: 'geohash_building', minZoom: 16, maxZoom: 16 },
};
function generateGeohashes(longitude, latitude) {
  const fullGeohash = geohash.encode(latitude, longitude, 9);

  return {
    full_geohash: fullGeohash,
    geohash_country: fullGeohash.substring(0, 2),
    geohash_region: fullGeohash.substring(0, 3),
    geohash_city: fullGeohash.substring(0, 4),
    geohash_district: fullGeohash.substring(0, 5),
    geohash_neighborhood: fullGeohash.substring(0, 6),
    geohash_street: fullGeohash.substring(0, 7),
    geohash_building: fullGeohash.substring(0, 8),
  };
}

function getGeographicLevelForZoom(zoom) {
  if (zoom <= 4) return GEOGRAPHIC_LEVELS.COUNTRY;
  if (zoom <= 7) return GEOGRAPHIC_LEVELS.REGION;
  if (zoom <= 10) return GEOGRAPHIC_LEVELS.CITY;
  if (zoom <= 12) return GEOGRAPHIC_LEVELS.DISTRICT;
  if (zoom <= 14) return GEOGRAPHIC_LEVELS.NEIGHBORHOOD;
  if (zoom <= 16) return GEOGRAPHIC_LEVELS.STREET;
  return GEOGRAPHIC_LEVELS.BUILDING;
}

function getGeohashConfigForZoom(zoom) {
  const level = getGeographicLevelForZoom(zoom);
  return {
    field: level.field,
    precision: level.precision,
    size: level.minZoom,
  };
}

export default {
  generateGeoHashes: generateGeohashes,
  getGeographicLevelForZoom,
  getGeohashConfigForZoom,
  GEOGRAPHIC_LEVELS,
};
