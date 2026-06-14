import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsLatLngTuple', async: false })
class IsLatLngTupleConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value) || value.length !== 2) return false;
    const [lat, lng] = value as [unknown, unknown];
    return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
  defaultMessage(_args: ValidationArguments): string {
    return 'userLocation must be a tuple of [latitude, longitude] with lat in [-90,90] and lng in [-180,180]';
  }
}

export class SearchRequestDto {
  @ApiProperty({ example: 'Pizza place near me' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ example: [30.0444, 31.2357], description: '[latitude, longitude]' })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => Number)
  @Validate(IsLatLngTupleConstraint)
  userLocation: [number, number]; // [latitude, longitude]

  @ApiPropertyOptional({ example: 50, description: 'Minimum price filter (inclusive). Overrides any NLP-extracted price filter.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ example: 250, description: 'Maximum price filter (inclusive). Overrides any NLP-extracted price filter.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ example: 4, description: 'Minimum business rating (1-5). Overrides any NLP-extracted rating filter.', minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  ratingMin?: number;

  @ApiPropertyOptional({ example: true, description: 'When true, restrict results to businesses currently open (overrides NLP time constraints).' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  openNow?: boolean;

  @ApiPropertyOptional({ example: 'cheap', enum: ['cheap', 'expensive'], description: 'Sort by price: "cheap" = ascending, "expensive" = descending. Overrides NLP-extracted sort.' })
  @IsOptional()
  @IsString()
  @IsIn(['cheap', 'expensive'])
  priceSort?: 'cheap' | 'expensive';

  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}
