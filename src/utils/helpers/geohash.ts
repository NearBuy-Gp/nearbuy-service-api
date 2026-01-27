import geohash from 'ngeohash';

const GEOGRAPHIC_LEVELS = {
  COUNTRY: { precision: 2, field: 'geohash_country', size: '~1250km x 625km' },
  REGION: { precision: 3, field: 'geohash_region', size: '~156km x 156km' },
  CITY: { precision: 4, field: 'geohash_city', size: '~39km x 19km' },
  DISTRICT: { precision: 5, field: 'geohash_district', size: '~4.9km x 4.9km' },
  NEIGHBORHOOD: {
    precision: 6,
    field: 'geohash_neighborhood',
    size: '~1.2km x 0.6km',
  },
  STREET: { precision: 7, field: 'geohash_street', size: '~153m x 153m' },
  BUILDING: { precision: 8, field: 'geohash_building', size: '~38m x 19m' },
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
    size: level.size,
  };
}

export default {
  generateGeohashes,
  getGeographicLevelForZoom,
  getGeohashConfigForZoom,
  GEOGRAPHIC_LEVELS,
};
