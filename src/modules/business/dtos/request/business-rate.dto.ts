import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BusinessRateDto {
  @ApiProperty({ example: 4.5, description: 'Rating between 0 and 5' })

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })

  @Min(0)
  @Max(5)
  rate: number;
}