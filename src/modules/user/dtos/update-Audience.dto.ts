// update-profile.dto.ts
import { IsNumber, IsString, IsArray, IsOptional, Min, Max } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsString()
  userType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}