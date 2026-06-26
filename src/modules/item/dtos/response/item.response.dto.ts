import { ApiProperty, ApiPropertyOptional, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ItemType } from '../../enums/item-type.enum';
import { RestaurantItemCategory } from '../../enums/resturant-category';
import { SizeEnum } from '../../enums/size.enum';
import { BusinessCategory } from '../../../business/enums/business-category.enum';
import { BusinessType } from '../../../business/enums/business-type.enum';
import { LocationDto } from '../../../business/dtos/request/business-location.dto';

/**
 * Type-specific attribute shapes.
 *
 * Each item `type` carries a different `attributes` object (Mongoose discriminator).
 * These DTOs document every possible shape so the frontend can switch on `type`
 * and know exactly which fields to expect — instead of guessing from raw documents.
 */

export class RestaurantItemAttributesResponseDto {
  @ApiProperty({ enum: RestaurantItemCategory, example: RestaurantItemCategory.PIZZA })
  menuCategory: RestaurantItemCategory;

  @ApiPropertyOptional({ example: 'Seasonal Specials' })
  otherMenuCategory?: string;

  @ApiPropertyOptional({ enum: SizeEnum, example: SizeEnum.MEDIUM })
  sizes?: SizeEnum;

  @ApiPropertyOptional({ type: [String], example: ['spicy', 'chef-special'] })
  tags?: string[];
}

export class ClinicServiceAttributesResponseDto {
  @ApiProperty({ example: 'Dr. Sarah Hassan' })
  doctorName: string;

  @ApiPropertyOptional({ example: 'Dermatology' })
  doctorSpecialization?: string;

  @ApiPropertyOptional({ example: '15 minutes' })
  waitingPeriod?: string;
}

export class ClassSessionAttributesResponseDto {
  @ApiProperty({ example: 'Coach Omar' })
  trainerName: string;

  @ApiPropertyOptional({ example: 'Mon/Wed/Fri 18:00' })
  schedule?: string;

  @ApiPropertyOptional({ example: '60 minutes' })
  duration?: string;

  @ApiPropertyOptional({ example: 20 })
  capacity?: number;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'], example: 'medium' })
  intensityLevel?: string;
}

export class GymMembershipAttributesResponseDto {
  @ApiPropertyOptional({ example: 'Premium' })
  accessLevel?: string;

  @ApiPropertyOptional({ example: '12 months' })
  validity?: string;

  @ApiPropertyOptional({ type: [String], example: ['Sauna', 'Personal Trainer'] })
  benefits?: string[];
}

export class SupermarketProductAttributesResponseDto {
  @ApiPropertyOptional({ example: 'Juhayna' })
  brand?: string;

  @ApiPropertyOptional({ example: '1L' })
  weight?: string;

  @ApiPropertyOptional({ example: 120 })
  stock?: number;
}

export class ClothingProductAttributesResponseDto {
  @ApiProperty({ enum: SizeEnum, isArray: true, example: [SizeEnum.MEDIUM, SizeEnum.LARGE] })
  sizes: SizeEnum[];

  @ApiPropertyOptional({ type: [String], example: ['Black', 'White'] })
  colorsAvailable?: string[];

  @ApiPropertyOptional({ example: 'Cotton' })
  material?: string;

  @ApiPropertyOptional({ example: 'Adidas' })
  brand?: string;

  @ApiPropertyOptional({ example: 50 })
  stock?: number;
}

export class PharmacyProductAttributesResponseDto {
  @ApiPropertyOptional({ example: 'Panadol' })
  brand?: string;

  @ApiPropertyOptional({ type: [String], example: ['Paracetamol'] })
  activeIngredients?: string[];

  @ApiPropertyOptional({ example: 'Tablet' })
  dosageForm?: string;

  @ApiPropertyOptional({ example: '20 tablets' })
  packageSize?: string;

  @ApiPropertyOptional({ example: 200 })
  stock?: number;
}

/**
 * Unified item shape returned by every endpoint that serializes items.
 *
 * - Top-level fields are stable across ALL item types.
 * - `attributes` is ALWAYS present (defaults to `{}`); its shape is documented
 *   per `type` via the `oneOf` below.
 * - `workingHours` and `embedding` are intentionally NOT serialized here:
 *   working hours belong to the business (returned once at business level) and
 *   `embedding` is an internal search vector.
 */
@ApiExtraModels(
  RestaurantItemAttributesResponseDto,
  ClinicServiceAttributesResponseDto,
  ClassSessionAttributesResponseDto,
  GymMembershipAttributesResponseDto,
  SupermarketProductAttributesResponseDto,
  ClothingProductAttributesResponseDto,
  PharmacyProductAttributesResponseDto,
)
export class ItemResponseDto {
  @ApiProperty({ example: '66c3dcaef3b3a6c94c8d91ab', description: 'Item MongoDB ID' })
  _id: string;

  @ApiProperty({ example: 'Chicken Alfredo Pasta' })
  name: string;

  @ApiPropertyOptional({ example: 'Creamy pasta with grilled chicken', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 120 })
  price: number;

  @ApiProperty({ type: [String], example: ['https://example.com/img.jpg'] })
  images: string[];

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ example: true })
  is_in_stock: boolean;

  @ApiProperty({ enum: ItemType, example: ItemType.RESTAURANT, description: 'Item type discriminator' })
  type: ItemType;

  @ApiProperty({ example: '66c3dcaef3b3a6c94c8d91aa', description: 'Owning business ID' })
  businessId: string;

  @ApiProperty({ example: "Mario's Pizza" })
  businessName: string;

  @ApiProperty({ enum: BusinessCategory })
  businessCategory: BusinessCategory;

  @ApiProperty({ enum: BusinessType })
  businessType: BusinessType;

  @ApiProperty({ example: '64c7b2f8c1a2b3c4d5e6f7a8', description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ type: LocationDto, description: 'GeoJSON Point [lng, lat] (inherited from business)' })
  location: LocationDto;

  @ApiProperty({ example: 4.5, description: 'Owning business rating (denormalized)' })
  businessRate: number;

  @ApiProperty({
    description:
      'Type-specific attributes. ALWAYS an object (may be empty). Shape depends on `type`.',
    oneOf: [
      { $ref: getSchemaPath(RestaurantItemAttributesResponseDto) },
      { $ref: getSchemaPath(ClinicServiceAttributesResponseDto) },
      { $ref: getSchemaPath(ClassSessionAttributesResponseDto) },
      { $ref: getSchemaPath(GymMembershipAttributesResponseDto) },
      { $ref: getSchemaPath(SupermarketProductAttributesResponseDto) },
      { $ref: getSchemaPath(ClothingProductAttributesResponseDto) },
      { $ref: getSchemaPath(PharmacyProductAttributesResponseDto) },
    ],
  })
  attributes: Record<string, any>;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: any): ItemResponseDto {
    const dto = new ItemResponseDto();
    dto._id = entity._id?.toString();
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.price = entity.price ?? 0;
    dto.images = entity.images ?? [];
    dto.isAvailable = entity.isAvailable ?? true;
    dto.is_in_stock = entity.is_in_stock ?? true;
    dto.type = entity.type;
    dto.businessId = entity.businessId?.toString();
    dto.businessName = entity.businessName;
    dto.businessCategory = entity.businessCategory;
    dto.businessType = entity.businessType;
    dto.categoryId = entity.categoryId?.toString();
    dto.location = entity.location ?? null;
    dto.businessRate = entity.businessRate ?? 0;
    // `attributes` is ALWAYS an object so the frontend can rely on the key
    // existing for every type — including service/legacy items with no discriminator.
    dto.attributes = entity.attributes ?? {};
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
