import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsEmail,
  IsUrl,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { LocationDto } from './business-location.dto';
import { SocialDto } from './business-social-links.dto';
import { WorkingHoursDto } from './business-working-hours.dto';

export class BusinessDto {
  @ApiProperty({ example: 'Gold’s Gym' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: BusinessType })
  @IsEnum(BusinessType)
  type: BusinessType;

  @ApiPropertyOptional({ enum: BusinessCategory })
  @IsOptional()
  @IsEnum(BusinessCategory)
  category?: BusinessCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ type: SocialDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialDto)
  social?: SocialDto;

  @ApiProperty({ example: 'Nasr City, Cairo' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    type: LocationDto,
    description: 'GeoJSON Point with coordinates [lng, lat]',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ type: [WorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
