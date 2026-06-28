import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
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

  @ApiPropertyOptional({ default: false, description: 'Whether the business is closed on this day. Defaults to open (false).' })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean = false;
}
