import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BusinessCategory } from 'src/modules/business/enums/business-category.enum';
import { CreateAvailabilityDto } from './create-availability.dto';
import { ItemType } from '../../enums/item-type.enum';

export class CreateItemDto {
  @ApiProperty({
    example: 'Fresh Milk 1L',
    description: 'Product or service display name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Premium quality fresh milk from local farms',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ItemType.PRODUCT,
    enum: ItemType,
    description: 'Defines if this is a product or service',
  })
  @IsEnum(ItemType)
  type: ItemType;

  // @ApiProperty({
  //   example: BusinessCategory.MEDICAL,
  //   enum: BusinessCategory,
  //   required: false,
  // })
  // @IsOptional()
  // @IsEnum(BusinessCategory)
  // category?: BusinessCategory;

  @ApiProperty({
    example: 'Dairy',
    required: false,
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({
    example: [
      'https://cdn.example.com/item1.png',
      'https://cdn.example.com/item2.png',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    example: ['milk', 'fresh', 'organic'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    example: 25,
    description: 'Price of the item in EGP',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    example: 100,
    description: 'Remaining stock quantity (applicable for products only)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiProperty({
    example: 45,
    description: 'Service duration (in minutes), only for services',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({
    description: 'Availability and booking configuration (services only)',
    required: false,
    type: CreateAvailabilityDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAvailabilityDto)
  availability?: CreateAvailabilityDto;

  @ApiProperty({
    example: { fat: '3%' },
    description: 'Dynamic metadata (color, size, model…)',
    required: false,
  })
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>;
}
