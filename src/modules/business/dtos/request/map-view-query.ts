import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BusinessCategory } from '../../enums/business-category.enum';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '../../enums/business-type.enum';

export class MapViewQueryDto {
  @ApiProperty({
    example: 31.2357,
    description: 'Southwest latitude',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  swLat: number;

  @ApiProperty({
    example: 31.2357,
    description: 'Southwest longitude',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  swLng: number;

  @ApiProperty({
    example: 31.2357,
    description: 'Northeast latitude',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  neLat: number;

  @ApiProperty({
    example: 31.2357,
    description: 'Northeast longitude',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  neLng: number;

  @ApiProperty({
    example: BusinessCategory.RESTAURANT,
    description: 'Category',
    required: false,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiProperty({
    example: 12,
    description: 'Map zoom level',
  })
  @IsNumber()
  @Type(() => Number)
  zoom: number;
}
