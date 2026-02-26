import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ProcessFileDto {
  @ApiProperty({
    example: 'Grilled Chicken Sandwich\nLarge - 90 EGP\nMedium - 70 EGP',
    description: 'Extracted raw text from uploaded file (OCR / PDF / CSV)',
  })
  @IsNotEmpty()
  @IsString()
  extractedText: string;

  @ApiProperty({
    example: ['missing price format', 'unrecognized category: deserts → desserts'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  warnings: string[];
}
