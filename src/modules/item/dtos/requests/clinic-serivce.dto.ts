import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClinicServiceAttributesDto {
  @ApiProperty({
    example: 'Dr. Ahmed Hassan',
    description: 'Doctor name',
  })
  @IsNotEmpty()
  @IsString()
  doctorName: string;

  @ApiProperty({
    example: 'Dermatology',
    description: 'Doctor specialization',
  })
  @IsOptional()
  @IsString()
  doctorSpecialization?: string;

  @ApiProperty({
    example: '15 minutes',
    description: 'Expected waiting time',
  })
  @IsOptional()
  @IsString()
  waitingPeriod?: string;
}
