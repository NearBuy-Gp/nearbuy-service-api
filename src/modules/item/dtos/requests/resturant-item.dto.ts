import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { RestaurantItemCategory } from '../../enums/resturant-category';
import { SizeEnum } from '../../enums/size.enum';

export class RestaurantItemAttributesDto {
  @ApiProperty({
    enum: RestaurantItemCategory,
    example: RestaurantItemCategory.PIZZA,
    description: 'Menu category',
  })
  @IsNotEmpty()
  @IsEnum(RestaurantItemCategory, {
    message: `menuCategory must be one of: ${Object.values(RestaurantItemCategory).join(', ')}`,
  })
  menuCategory: RestaurantItemCategory;

  @ApiProperty({
    enum: RestaurantItemCategory,
    example: RestaurantItemCategory.PIZZA,
    description: 'Other Menu category',
  })
  @IsString({ each: true })
  @ValidateIf((option) => option.targetAudience?.includes(RestaurantItemCategory.OTHERS))
  otherMenuCategory?: string;

  @ApiProperty({
    enum: SizeEnum,
    example: SizeEnum.MEDIUM,
    description: 'Serving size',
  })
  @IsEnum(SizeEnum, {
    message: `sizes must be one of: ${Object.values(SizeEnum).join(', ')}`,
  })
  @IsOptional()
  sizes?: SizeEnum;

  @ApiProperty({
    example: ['spicy', 'chef-special'],
    description: 'Tags',
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
