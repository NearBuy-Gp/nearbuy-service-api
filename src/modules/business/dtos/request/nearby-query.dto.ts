import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BusinessCategory } from '../../enums/business-category.enum';

export class NearbyQueryDto {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lng: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number = 10000;

  @IsOptional()
  @IsEnum(BusinessCategory)
  category?: BusinessCategory;
}
