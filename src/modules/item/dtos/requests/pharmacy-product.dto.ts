import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class PharmacyProductAttributesDto {
  @ApiProperty({
    example: 'Pfizer',
    description: 'Medicine brand',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    example: ['Paracetamol', 'Caffeine'],
    description: 'Active ingredients',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activeIngredients?: string[];

  @ApiProperty({
    example: 'Tablet',
    description: 'Dosage form',
  })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiProperty({
    example: '24 tablets',
    description: 'Package size',
  })
  @IsOptional()
  @IsString()
  packageSize?: string;

  @ApiProperty({
    example: 200,
    description: 'Available stock count',
  })
  @IsOptional()
  @IsNumber()
  stock?: number;
}
