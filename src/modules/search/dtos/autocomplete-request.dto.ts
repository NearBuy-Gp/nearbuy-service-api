import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AutocompleteRequestDto {
  @ApiProperty({ example: 'piz', description: 'Partial query to autocomplete against item names.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({ example: 8, description: 'Max number of suggestions to return (1-20).', default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}
