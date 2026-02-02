import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SizeEnum } from '../../enums/size.enum';

export class ClothingProductAttributesDto {
  @ApiProperty({
    example: ['S', 'M', 'L'],
    description: 'Available sizes',
  })
  @IsArray()
  @IsEnum(SizeEnum, { each: true })
  size: SizeEnum[];

  @ApiProperty({
    example: ['Black', 'White'],
    description: 'Available colors',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colorsAvailable?: string[];

  @ApiProperty({
    example: 'Cotton',
    description: 'Material of the clothing item',
  })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiProperty({
    example: 'Zara',
    description: 'Brand name',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({
    example: 120,
    description: 'Available stock count',
  })
  @IsNumber()
  @IsOptional()
  stock?: number;
}
