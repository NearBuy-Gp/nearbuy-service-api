import { BadRequestException } from '@nestjs/common';

export const getCoordinates = async (location: string): Promise<[number, number]> => {
  const query = encodeURIComponent(`${location}, Egypt`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NearbuyApp/1.0' },
  });
  const data = await response.json();
  if (!data.length) throw new BadRequestException(`Place not found: ${location}`);

  // Return [lng, lat] (Mongo expects [lng, lat])
  return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
};
