import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

interface NominatimResult {
  lon: string;
  lat: string;
}

const GEOCODE_TIMEOUT_MS = 5000;

export const getCoordinates = async (location: string): Promise<[number, number]> => {
  const query = encodeURIComponent(`${location}, Egypt`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  // Bound the outbound call so a slow/unreachable Nominatim cannot hang the
  // whole search request (fetch has no default timeout).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  let data: NominatimResult[];
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NearbuyApp/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(`Geocoding failed for "${location}" (status ${response.status})`);
    }
    data = (await response.json()) as NominatimResult[];
  } catch (err) {
    if (err instanceof ServiceUnavailableException) throw err;
    // Network failure or abort/timeout — surface as a transient 503.
    throw new ServiceUnavailableException(`Geocoding service unavailable for "${location}"`);
  } finally {
    clearTimeout(timer);
  }

  if (!data.length) throw new BadRequestException(`Place not found: ${location}`);

  // Return [lng, lat] (Mongo expects [lng, lat])
  return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
};
