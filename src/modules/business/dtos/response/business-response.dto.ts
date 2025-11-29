import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { LocationDto } from '../request/business-location.dto';
import { SocialDto } from '../request/business-social-links.dto';
import { WorkingHoursDto } from '../request/business-working-hours.dto';

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
}
