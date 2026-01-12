import { ApiProperty } from '@nestjs/swagger';
import { BusinessStatus } from '../../enums/business-status.enum';
import { IsEnum } from 'class-validator';

export class BusinessOnMapDto {
  @ApiProperty({ example: "Gold's Gym" })
  name: string;

  @ApiProperty({
    example: [31.2357, 30.0444],
    type: [Number],
    description: 'Coordinates as [longitude, latitude]',
  })
  coordinates: number[];

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  image: string;

  @ApiProperty({ example: 'asdfd' })
  id: string;

  @ApiProperty({ example: BusinessStatus.OPEN })
  @IsEnum(BusinessStatus)
  status: BusinessStatus;
}
