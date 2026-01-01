import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty({
    example: true,
    description: 'Is the service currently available?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    example: true,
    description: 'Does the service require booking?',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  bookingRequired?: boolean;

  @ApiProperty({
    example: 30,
    description: 'Estimated duration (in minutes) for one service session',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({
    example: [
      { day: 'monday', times: ['10:00', '11:00', '12:00'] },
      { day: 'wednesday', times: ['14:00', '15:00'] },
    ],
    description: 'Available booking slots by day',
    required: false,
  })
  @IsOptional()
  @IsArray()
  slots?: {
    day: string;
    times: string[];
  }[];
}
