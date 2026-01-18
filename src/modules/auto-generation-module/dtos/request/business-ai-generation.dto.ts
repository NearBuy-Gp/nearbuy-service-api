import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  ArrayNotEmpty
} from 'class-validator';
import {Type} from 'class-transformer';
import { BusinessMainCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';

export class GenerateBusinessAiDto {
  
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(BusinessMainCategory)
  category: BusinessMainCategory;

  @IsEnum(BusinessType)
  type: BusinessType;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  mainItems: string[];

  @IsString()
  targetAudience: string;
}