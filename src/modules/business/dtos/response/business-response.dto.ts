import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { BusinessStatus } from '../../enums/business-status.enum';
import { BusinessFacility } from '../../enums/business-facilities.enum';
import { BusinessMainItem } from '../../enums/business-mainitems.enum';
import { BusinessTargetAudience } from '../../enums/business-target-audience';
import { LocationDto } from '../request/business-location.dto';
import { SocialDto } from '../request/business-social-links.dto';
import { WorkingHoursDto } from '../request/business-working-hours.dto';
import { Business } from '../../schemas/buisness.schema';

/**
 * Canonical business shape. Every business-returning endpoint serializes the
 * SAME set of fields with the SAME empty-value conventions so the frontend has
 * a single contract regardless of which endpoint it calls:
 *   - optional scalars  -> `null` when absent
 *   - objects           -> `{}` when absent
 *   - arrays            -> `[]` when absent
 *
 * `BusinessWithItemsResponseDto` extends this and only adds paginated items.
 */
export class BusinessResponseDto {
  @ApiProperty({ example: '66c3dcaef3b3a6c94c8d91ab', description: 'Business MongoDB ID' })
  _id: string;

  @ApiProperty({ example: "Gold's Gym" })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ enum: BusinessType })
  type: BusinessType;

  @ApiPropertyOptional({ enum: BusinessCategory, nullable: true })
  category?: BusinessCategory | null;

  @ApiPropertyOptional({ nullable: true })
  subcategory?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  website?: string | null;

  @ApiProperty({ type: SocialDto })
  social: SocialDto;

  @ApiProperty({ example: 'Nasr City, Cairo' })
  address: string;

  @ApiProperty({ type: LocationDto, description: 'GeoJSON Point with coordinates [lng, lat]' })
  location: LocationDto;

  @ApiProperty({ type: [WorkingHoursDto], description: 'Working hours — the single source of truth (not duplicated on items)' })
  workingHours: WorkingHoursDto[];

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ enum: BusinessStatus })
  status: BusinessStatus;

  @ApiProperty({ enum: BusinessFacility, isArray: true })
  facilities: BusinessFacility[];

  @ApiProperty({ enum: BusinessTargetAudience, isArray: true })
  targetAudience: BusinessTargetAudience[];

  @ApiProperty({ enum: BusinessMainItem, isArray: true })
  mainItems: BusinessMainItem[];

  @ApiProperty({ type: [String] })
  mainItemsOthers: string[];

  @ApiProperty({ type: [String] })
  targetAudienceOther: string[];

  @ApiProperty({ example: false })
  is_open_now: boolean;

  @ApiProperty({ example: 4.5 })
  rate: number;

  @ApiProperty({ example: 12 })
  numberOfRatings: number;

  @ApiProperty({ example: { hasDelivery: true }, description: 'Free-form business-level metadata' })
  attributes: Record<string, any>;

  /** Maps a business document onto the canonical shape with consistent empty-values. */
  protected static assign<T extends BusinessResponseDto>(dto: T, entity: Business | any): T {
    dto._id = entity._id?.toString();
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.tags = entity.tags ?? [];
    dto.type = entity.type;
    dto.category = entity.category ?? null;
    dto.subcategory = entity.subcategory ?? null;
    dto.phone = entity.phone ?? null;
    dto.email = entity.email ?? null;
    dto.website = entity.website ?? null;
    dto.social = entity.social ?? {};
    dto.address = entity.address;
    dto.location = entity.location ?? null;
    dto.workingHours = entity.workingHours ?? [];
    dto.images = entity.images ?? [];
    dto.status = entity.status ?? null;
    dto.facilities = entity.facilities ?? [];
    dto.targetAudience = entity.targetAudience ?? [];
    dto.mainItems = entity.mainItems ?? [];
    dto.mainItemsOthers = entity.mainItemsOthers ?? [];
    dto.targetAudienceOther = entity.targetAudienceOther ?? [];
    dto.is_open_now = entity.is_open_now ?? false;
    dto.rate = entity.rate ?? 0;
    dto.numberOfRatings = entity.numberOfRatings ?? 0;
    dto.attributes = entity.attributes ?? {};
    return dto;
  }

  static fromEntity(entity: Business | any): BusinessResponseDto {
    return BusinessResponseDto.assign(new BusinessResponseDto(), entity);
  }
}
