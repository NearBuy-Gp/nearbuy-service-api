import { ApiProperty } from '@nestjs/swagger';
import { BusinessStatus } from '../../enums/business-status.enum';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessType } from '../../enums/business-type.enum';

export class BusinessNearMeDto {
  @ApiProperty({ example: "Gold's Gym" })
  name: string;

  @ApiProperty({
    example: [31.2357, 30.0444],
    type: [Number],
    description: 'Coordinates as [longitude, latitude]',
  })
  coordinates: number[];
  @ApiProperty({ example: 'asdfd' })
  id: string;
  @ApiProperty({ example: BusinessStatus.OPEN })
  status: BusinessStatus;
  @ApiProperty({ example: '4.2' })
  rate: number;
  @ApiProperty({
    enum: BusinessCategory,
    example: BusinessCategory.RESTAURANT,
  })
  category: BusinessCategory;
  @ApiProperty({ example: 'masr elgdida' })
  address: string;
  @ApiProperty({ type: [String], example: ['photo', 'photo'] })
  images: string[];
  @ApiProperty({ type: [String], example: ['tag', 'tag'] })
  tags: string[];
  @ApiProperty({ enum: BusinessType, example: BusinessType.CAFE })
  type: BusinessType;
  @ApiProperty({ example: 'A cozy place for coffee lovers' })
  description: string;
}
