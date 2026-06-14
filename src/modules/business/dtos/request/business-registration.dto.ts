import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { LocationDto } from './business-location.dto';
import { SocialDto } from './business-social-links.dto';
import { WorkingHoursDto } from './business-working-hours.dto';
import { BusinessTargetAudience } from '../../enums/business-target-audience';
import { BusinessFacility } from '../../enums/business-facilities.enum';
import { BusinessMainItem } from '../../enums/business-mainitems.enum';

export class BusinessRegistrationDto {
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
  @IsNotEmpty()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ type: [WorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({
    type: [String],
    enum: BusinessMainItem,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BusinessMainItem, { each: true })
  mainItems?: BusinessMainItem[];

  @ApiPropertyOptional({
    type: [String],
    example: ['apple', 'banana'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((option) => option.targetAudience?.includes(BusinessMainItem.OTHERS))
  mainItemsOthers?: string[];

  @ApiPropertyOptional({
    type: [String],
    enum: BusinessFacility,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BusinessFacility, { each: true })
  facilities?: BusinessFacility[];

  @ApiPropertyOptional({
    type: [String],
    enum: BusinessTargetAudience,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BusinessTargetAudience, { each: true })
  targetAudience?: BusinessTargetAudience[];

  @ApiPropertyOptional({
    type: [String],
    example: ['teenagers', 'adults'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((option) => option.targetAudience?.includes(BusinessTargetAudience.OTHERS))
  targetAudienceOther?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
