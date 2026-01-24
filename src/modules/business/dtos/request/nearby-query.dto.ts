import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { BusinessCategory } from '../../enums/business-category.enum';
import { ApiProperty } from '@nestjs/swagger';

export class NearbyQueryDto {
  @ApiProperty({
    example: 31.2357,
    description: 'Latitude',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @ApiProperty({
    example: 31.2357,
    description: 'Longitude',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @ApiProperty({
    example: 10000,
    description: 'Radius in meters',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number = 10000;

  @ApiProperty({
    example: BusinessCategory.RESTAURANT,
    description: 'Category',
    required: false,
  })
  @IsOptional()
  @IsEnum(BusinessCategory)
  category?: BusinessCategory;
  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 5,
    description: 'Limit number of items per page',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 5;
}
