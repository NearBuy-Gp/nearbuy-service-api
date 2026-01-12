import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class LocationDto {
  @ApiProperty({
    example: [31.2357, 30.0444],
    description: 'Coordinates in order: [longitude, latitude]',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];
}
