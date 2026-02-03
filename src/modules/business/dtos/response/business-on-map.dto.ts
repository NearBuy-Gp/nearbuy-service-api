import { ApiProperty } from '@nestjs/swagger';
import { BusinessStatus } from '../../enums/business-status.enum';
import { IsEnum } from 'class-validator';
import { BusinessCategory } from '../../enums/business-category.enum';
import { Business } from '../../schemas/buisness.schema';

export class BusinessOnMapDto {
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
  @IsEnum(BusinessStatus)
  status: BusinessStatus;

  @ApiProperty({ example: '4.2' })
  rate: number;

  @ApiProperty({
    enum: BusinessCategory,
    example: BusinessCategory.RESTAURANT,
  })
  category: BusinessCategory;
  static fromEntity(entity: Business): BusinessOnMapDto {
    const dto = new BusinessOnMapDto();
    dto.id = entity._id.toString();
    dto.name = entity.name;
    dto.coordinates = entity.location.coordinates;
    dto.status = entity.status;
    dto.rate = entity.rate;
    dto.category = entity.category as BusinessCategory;
    return dto;
  }
}
