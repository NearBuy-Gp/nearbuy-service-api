import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateItemDto {
  @ApiPropertyOptional({
    example: 'Chicken Alfredo',
    description: 'Display name of the item',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Creamy pasta with grilled chicken',
    description: 'Optional item description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Item price',
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    example: ['https://img.com/1.png'],
    description: 'Item images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Is item currently available',
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Type-specific attributes',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  attributes?: Record<string, any>;
}
