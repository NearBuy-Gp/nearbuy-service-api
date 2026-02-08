import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class BusinessRateDto {
  @ApiProperty({ example: 4.5, description: 'Rating of the business between 0 to 5' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rate: number;
}
