// dto/create-item.base.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

export class CreateItemBaseDto {
  @ApiProperty({
    example: 'Chicken Alfredo',
    description: 'Display name of the item',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Creamy pasta with grilled chicken',
    description: 'Optional item description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 120,
    description: 'Item price',
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: ['https://img.com/1.png'],
    description: 'Item images',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: true,
    description: 'Is item currently available',
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({
    example: '66c3dcaef3b3a6c94c8d91aa',
    description: 'Business ID',
  })
  @IsMongoId()
  businessId: string;

  @ApiProperty({
    enum: ItemType,
    example: ItemType.RESTAURANT,
    description: 'Item discriminator type',
  })
  @IsNotEmpty()
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({
    example: '66c3dcaef3b3a6c94c8d91bb',
    description: 'Category ID',
  })
  @IsMongoId()
  categoryId: string;
}
