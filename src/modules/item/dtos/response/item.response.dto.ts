// // import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
// // export class RestaurantItemResponseDto extends ItemBaseResponseDto {
// //   @ApiProperty({
// //     example: 'RESTAURANT',
// //     description: 'Item type',
// //   })
// //   type: 'RESTAURANT';

// import { ApiProperty } from '@nestjs/swagger';
// import { ItemType } from '../../enums/item-type.enum';

// //   @ApiProperty({
// //     description: 'Restaurant-specific attributes',
// //     example: {
// //       menuCategory: 'PASTA',
// //       sizes: 'MEDIUM',
// //       tags: ['popular', 'chef-special', 'spicy'],
// //     },
// //   })
// //   attributes: {
// //     menuCategory: string;
// //     sizes: string;
// //     tags: string[];
// //   };
// // }

// // // Clinic Service Response
// // export class ClinicServiceResponseDto extends ItemBaseResponseDto {
// //   @ApiProperty({
// //     example: 'CLINIC',
// //     description: 'Item type',
// //   })
// //   type: 'CLINIC';

// //   @ApiProperty({
// //     description: 'Clinic service-specific attributes',
// //     example: {
// //       duration: 60,
// //       specialization: 'GENERAL',
// //       requiresAppointment: true,
// //     },
// //   })
// //   attributes: {
// //     duration: number;
// //     specialization: string;
// //     requiresAppointment: boolean;
// //   };
// // }

// // // Class Session Response
// // export class ClassSessionResponseDto extends ItemBaseResponseDto {
// //   @ApiProperty({
// //     example: 'CLASS',
// //     description: 'Item type',
// //   })
// //   type: 'CLASS';

// //   @ApiProperty({
// //     description: 'Class session-specific attributes',
// //     example: {
// //       duration: 90,
// //       maxParticipants: 20,
// //       level: 'BEGINNER',
// //       subject: 'YOGA',
// //     },
// //   })
// //   attributes: {
// //     duration: number;
// //     maxParticipants: number;
// //     level: string;
// //     subject: string;
// //   };
// // }

// // // Pharmacy Product Response
// // export class PharmacyProductResponseDto extends ItemBaseResponseDto {
// //   @ApiProperty({
// //     example: 'PHARMACY',
// //     description: 'Item type',
// //   })
// //   type: 'PHARMACY';

// //   @ApiProperty({
// //     description: 'Pharmacy product-specific attributes',
// //     example: {
// //       requiresPrescription: false,
// //       dosageForm: 'TABLET',
// //       strength: '500mg',
// //       manufacturer: 'PharmaCorp',
// //     },
// //   })
// //   attributes: {
// //     requiresPrescription: boolean;
// //     dosageForm: string;
// //     strength: string;
// //     manufacturer: string;
// //   };
// // }

// // // Supermarket Product Response
// // export class SupermarketProductResponseDto extends ItemBaseResponseDto {
// //   @ApiProperty({
// //     example: 'SUPERMARKET',
// //     description: 'Item type',
// //   })
// //   type: 'SUPERMARKET';

// //   @ApiProperty({
// //     description: 'Supermarket product-specific attributes',
// //     example: {
// //       category: 'GROCERIES',
// //       brand: 'BrandName',
// //       weight: '500g',
// //       expiryDate: '2025-12-31',
// //     },
// //   })
// //   attributes: {
// //     category: string;
// //     brand: string;
// //     weight: string;
// //     expiryDate?: string;
// //   };
// // }

// // // Clothing Product Response
// // export class ClothingProductResponseDto extends ItemBaseResponseDto {
// //   @ApiProperty({
// //     example: 'CLOTHING',
// //     description: 'Item type',
// //   })
// //   type: 'CLOTHING';

// //   @ApiProperty({
// //     description: 'Clothing product-specific attributes',
// //     example: {
// //       size: 'M',
// //       color: 'Blue',
// //       material: 'Cotton',
// //       brand: 'FashionBrand',
// //     },
// //   })
// //   attributes: {
// //     size: string;
// //     color: string;
// //     material: string;
// //     brand: string;
// //   };
// // }

// // export class ItemResponseDto {
// //   @ApiProperty({
// //     example: 'Item Added Successfully',
// //     description: 'Success message',
// //   })
// //   message: string;

// //   @ApiProperty({
// //     description: 'Created item object with type-specific attributes',
// //     oneOf: [
// //       { $ref: getSchemaPath(RestaurantItemResponseDto) },
// //       { $ref: getSchemaPath(ClinicServiceResponseDto) },
// //       { $ref: getSchemaPath(ClassSessionResponseDto) },
// //       { $ref: getSchemaPath(PharmacyProductResponseDto) },
// //       { $ref: getSchemaPath(SupermarketProductResponseDto) },
// //       { $ref: getSchemaPath(ClothingProductResponseDto) },
// //     ],
// //   })
// //   item:
// //     | RestaurantItemResponseDto
// //     | ClinicServiceResponseDto
// //     | ClassSessionResponseDto
// //     | PharmacyProductResponseDto
// //     | SupermarketProductResponseDto
// //     | ClothingProductResponseDto;
// // }

// export class ItemResponseDto {
//   @ApiProperty({
//     example: '66c3dcaef3b3a6c94c8d91ab',
//     description: 'Item MongoDB ID',
//   })
//   _id: string;

//   @ApiProperty({
//     example: 'Chicken Alfredo Pasta',
//     description: 'Item name',
//   })
//   name: string;

//   @ApiProperty({
//     example: 'Creamy pasta with grilled chicken and parmesan cheese',
//     description: 'Item description',
//     required: false,
//   })
//   description?: string;

//   @ApiProperty({
//     example: 120,
//     description: 'Item price',
//   })
//   price: number;

//   @ApiProperty({
//     example: ['https://example.com/images/chicken-alfredo.jpg'],
//     description: 'Item images',
//     type: [String],
//     required: false,
//   })
//   images?: string[];

//   @ApiProperty({
//     example: true,
//     description: 'Availability status',
//   })
//   isAvailable: boolean;

//   @ApiProperty({
//     example: '66c3dcaef3b3a6c94c8d91aa',
//     description: 'Business ID',
//   })
//   businessId: string;

//   @ApiProperty({
//     example: '2024-01-15T10:30:00.000Z',
//     description: 'Creation timestamp',
//   })
//   createdAt: Date;

//   @ApiProperty({
//     example: '2024-01-15T10:30:00.000Z',
//     description: 'Last update timestamp',
//   })
//   updatedAt: Date;

//   @ApiProperty({
//     enum:ItemType,
//     example: ItemType.RESTAURANT,
//     description: 'Item type discriminator',
//   })
//   type: string;

//   @ApiProperty({
//     description: 'Type-specific attributes',
//     required: false,
//   })
//   attributes?: Record<string, any>;
// }
