import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { LocationDto } from '../request/business-location.dto';
import { SocialDto } from '../request/business-social-links.dto';
import { WorkingHoursDto } from '../request/business-working-hours.dto';
import { Business } from '../../schemas/buisness.schema';

export class BusinessResponseDto {
  @ApiProperty({ example: 'Gold’s Gym' })
  name: string;

  @ApiPropertyOptional()
  description?: string;

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

  @ApiPropertyOptional({ type: [String] })
  facilities?: string[];

  @ApiProperty({
    example: '66c3dcaef3b3a6c94c8d91ab',
    description: 'Business MongoDB ID',
  })
  _id: string;
  @ApiProperty({ example: 4.5 })
  rate: number;
  static fromEntity(entity: Business): BusinessResponseDto {
    const dto = new BusinessResponseDto();
    dto.name = entity.name;
    dto.description = entity.description || '';
    dto.tags = entity.tags;
    dto.type = entity.type;
    dto.category = entity.category;
    dto.subcategory = entity.subcategory || '';
    dto.phone = entity.phone || '';
    dto.email = entity.email || '';
    dto.website = entity.website || '';
    dto.social = entity.social || {};
    dto.address = entity.address;
    dto.location = entity.location;
    dto.workingHours = entity.workingHours || [];
    dto.images = entity.images || [];
    dto.facilities = entity.facilities || [];
    dto._id = entity._id.toString();
    dto.rate = entity.rate;
    return dto;
  }
}
