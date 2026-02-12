import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { BusinessStatus } from '../../enums/business-status.enum';
import { LocationDto } from '../request/business-location.dto';
import { SocialDto } from '../request/business-social-links.dto';
import { WorkingHoursDto } from '../request/business-working-hours.dto';
import { Item } from 'src/modules/item/schemas/item.schema';
import { PaginatedItemsResponseDto } from 'src/modules/item/dtos/response/paginated-items-response.dto';

export class BusinessWithItemsResponseDto {
  @ApiProperty({
    example: '66c3dcaef3b3a6c94c8d91ab',
    description: 'Business MongoDB ID',
  })
  _id: string;

  @ApiProperty({ example: "Gold's Gym" })
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty({ enum: BusinessType })
  type: BusinessType;

  @ApiPropertyOptional({ enum: BusinessCategory })
  category?: BusinessCategory;

  @ApiPropertyOptional()
  subcategory?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional({ type: SocialDto })
  social?: SocialDto;

  @ApiProperty({ example: 'Nasr City, Cairo' })
  address: string;

  @ApiProperty({
    type: LocationDto,
    description: 'GeoJSON Point with coordinates [lng, lat]',
  })
  location: LocationDto;

  @ApiPropertyOptional({ type: [WorkingHoursDto] })
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiProperty({ enum: BusinessStatus })
  status: BusinessStatus;

  @ApiProperty({ example: 4.5 })
  rate: number;

  @ApiProperty({
    type: [Item],
    description: 'Business items',
  })
  itemsPaginated?: PaginatedItemsResponseDto;
  static fromEntity(entity: any): BusinessWithItemsResponseDto {
    const dto = new BusinessWithItemsResponseDto();
    dto._id = entity._id;
    dto.name = entity.name ?? null;
    dto.description = entity.description || null;
    dto.tags = entity.tags || [];
    dto.type = entity.type ?? null;
    dto.category = entity.category ?? null;
    dto.subcategory = entity.subcategory ?? null;
    dto.phone = entity.phone ?? null;
    dto.email = entity.email ?? null;
    dto.website = entity.website ?? null;
    dto.social = entity.social ?? null;
    dto.address = entity.address ?? null;
    dto.location = entity.location ?? null;
    dto.workingHours = entity.workingHours || [];
    dto.images = entity.images || [];
    dto.status = entity.status ?? null;
    dto.rate = entity.rate;
    dto.itemsPaginated = entity.itemsPaginated;
    return dto;
  }
}
