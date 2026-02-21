import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUrl } from 'class-validator';

export class SocialDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  tiktok?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value?.trim() === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  linkedIn?: string;
}
