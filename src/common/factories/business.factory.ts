// import { faker } from '@faker-js/faker';
// import { Types } from 'mongoose';
// import { BusinessCategory } from 'src/modules/business/enums/business-category.enum';
// import { BusinessFacility } from 'src/modules/business/enums/business-facilities.enum';
// import { BusinessTargetAudience } from 'src/modules/business/enums/business-target-audience';
// import { BusinessType } from 'src/modules/business/enums/business-type.enum';

// const CENTER_LAT = 29.955560664016126;
// const CENTER_LNG = 31.02491697797309;
// const RADIUS = 5000;

// export const createFakeBusiness = (ownerId: Types.ObjectId) => {
//   const { MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG } = generateRandomCoordinates();
//   const lat = faker.number.float({
//     min: MIN_LAT,
//     max: MAX_LAT,
//     fractionDigits: 6,
//   });

//   const lng = faker.number.float({
//     min: MIN_LNG,
//     max: MAX_LNG,
//     fractionDigits: 6,
//   });

//   return {
//     name: faker.company.name(),
//     description: faker.company.catchPhrase(),
//     tags: faker.lorem.words(5).split(' '),
//     type: faker.helpers.enumValue(BusinessType),
//     category: faker.helpers.enumValue(BusinessCategory),
//     phone: faker.phone.number(),
//     email: faker.internet.email(),
//     address: faker.location.streetAddress(),
//     location: {
//       type: 'Point',
//       coordinates: [lng, lat],
//     },
//     ownerId,
//     rate: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
//     numberOfRatings: faker.number.int({ min: 10, max: 500 }),
//     images: faker.helpers.multiple(() => faker.image.url(), { count: 2 }),
//     socials: {
//       facebook: faker.internet.url(),
//       twitter: faker.internet.url(),
//       instagram: faker.internet.url(),
//     },
//     BusinessTargetAudience: faker.helpers.enumValue(BusinessTargetAudience),
//     facilities: faker.helpers.enumValue(BusinessFacility),
//     workingHours: randomWorkingHours(),
//   };
// };

// function generateRandomCoordinates() {
//   const metersToDegreesLat = (meters) => meters / 111320;
//   const metersToDegreesLng = (meters, lat) => meters / (111320 * Math.cos((lat * Math.PI) / 180));
//   const latRange = metersToDegreesLat(RADIUS);
//   const lngRange = metersToDegreesLng(RADIUS, CENTER_LAT);

//   const MIN_LAT = CENTER_LAT - latRange;
//   const MAX_LAT = CENTER_LAT + latRange;

//   const MIN_LNG = CENTER_LNG - lngRange;
//   const MAX_LNG = CENTER_LNG + lngRange;
//   return { MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG };
// }
// function randomWorkingHours() {
//   return ['09:00', '10:00', '11:00'].map((start) => ({
//     day: faker.date.weekday(),
//     from: start,
//     to: faker.number.int({ min: 16, max: 20 }) + ':00',
//   }));
// }

// function pickRandomEnumValues<T>(enumObj: T, min = 1, max?: number): T[keyof T][] {
//   const values = Object.values(enumObj);
//   const count = faker.number.int({ min, max: max ?? values.length });
//   return faker.helpers.arrayElements(values, count);
// }
