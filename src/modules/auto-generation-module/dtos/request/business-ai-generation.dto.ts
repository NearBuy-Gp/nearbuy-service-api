import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { BusinessCategory } from '../../../business/enums/business-category.enum';
import { BusinessType } from '../../../business/enums/business-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessMainItem } from '../../../business/enums/business-mainitems.enum';
import { BusinessTargetAudience } from '../../../business/enums/business-target-audience';

export class GenerateBusinessAiDto {
  @ApiProperty({
    description: 'Name of the business',
    example: 'Healthy Bites',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Category of the business',
    example: BusinessCategory.RESTAURANT,
  })
  @IsEnum(BusinessCategory)
  category: BusinessCategory;

  @ApiProperty({
    description: 'Type of the business',
    example: BusinessType.FAST_FOOD,
  })
  @IsEnum(BusinessType)
  type: BusinessType;

  @ApiProperty({
    description: 'Main items or services offered by the business',
    example: ['Burgers', 'Salads', 'Smoothies'],
  })
  @ApiProperty({
    type: [String],
    enum: BusinessMainItem,
    isArray: true,
  })
  @IsArray()
  @IsEnum(BusinessMainItem, { each: true })
  mainItems: BusinessMainItem[];

  @IsOptional()
  @IsArray()
  mainItemsOthers?: string[];

  @ApiProperty({
    description: 'Target audience for the business',
    example: 'Health-conscious individuals aged 18-35',
  })
  @ApiProperty({
    type: [String],
    enum: BusinessTargetAudience,
    isArray: true,
  })
  @IsArray()
  @IsEnum(BusinessTargetAudience, { each: true })
  @IsString({ each: true })
  @ValidateIf((option) => option.targetAudience?.includes(BusinessTargetAudience.OTHERS))
  targetAudience: BusinessTargetAudience[];

  @IsOptional()
  @IsArray()
  targetAudienceOthers?: string[];
}
