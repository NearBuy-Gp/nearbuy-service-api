import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ElectronicsProductAttributesDto {
  @ApiProperty({
    example: 'Apple',
    description: 'Product brand',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: 'Product model',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    example: '1 year',
    description: 'Warranty period',
    required: false,
  })
  @IsOptional()
  @IsString()
  warranty?: string;

  @ApiProperty({
    example: 50,
    description: 'Available stock count',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  stock?: number;
}
