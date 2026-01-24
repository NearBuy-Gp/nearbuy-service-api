import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BusinessCategory } from '../../enums/business-category.enum';

export class MapViewQueryDto {
  @IsNumber()
  @Type(() => Number)
  swLat: number;

  @IsNumber()
  @Type(() => Number)
  swLng: number;

  @IsNumber()
  @Type(() => Number)
  neLat: number;

  @IsNumber()
  @Type(() => Number)
  neLng: number;

  @IsOptional()
  @IsEnum(BusinessCategory)
  category?: BusinessCategory;
}
