import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class SocialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  tiktok?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedIn?: string;
}
