import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BusinessCategory } from '../../../business/enums/business-category.enum';
import { BusinessType } from '../../../business/enums/business-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessTargetAudience } from 'src/modules/business/enums/business-target-audience';
import { BusinessMainItem } from 'src/modules/business/enums/business-mainitems.enum';

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
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(BusinessMainItem, { each: true })
  mainItems: BusinessMainItem[];

  @ApiProperty({
    description: 'Target audience for the business',
    example: 'Health-conscious individuals aged 18-35',
  })
  @ArrayNotEmpty()
  @IsEnum(BusinessTargetAudience, { each: true })
  targetAudience: BusinessTargetAudience[];
}
