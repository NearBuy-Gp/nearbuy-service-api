import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SupermarketProductAttributesDto {
  @ApiProperty({
    example: 'Nestle',
    description: 'Product brand',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    example: '1kg',
    description: 'Product weight',
  })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiProperty({
    example: 50,
    description: 'Available stock count',
  })
  @IsOptional()
  @IsNumber()
  stock?: number;
}
