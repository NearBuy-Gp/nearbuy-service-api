import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WeekDays } from '../../../../utils/enums/week-days.enum';

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
  from?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isClosed?: boolean;
}
