import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { WeekDays } from 'src/utils/enums/week-days.enum';

export class WorkingHoursDto {
  @ApiProperty({
    example: WeekDays.MONDAY,
    enum: WeekDays,
  })
  @IsEnum(WeekDays)
  day: WeekDays;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  open?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  close?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isClosed?: boolean;
}
