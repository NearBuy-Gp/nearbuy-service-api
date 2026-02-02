import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class ClassSessionAttributesDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  trainerName: string;

  @ApiProperty({ example: 'Mon/Wed 6PM' })
  @IsString()
  schedule: string;

  @ApiProperty({ example: '1 hour' })
  @IsString()
  duration: string;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({
    enum: ['low', 'medium', 'high'],
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  intensityLevel?: string;
}
