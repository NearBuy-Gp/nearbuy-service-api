import { ApiProperty } from '@nestjs/swagger';
import { BusinessNearMeDto } from './business-near-me..dto';

export class PaginatedBusinessNearMeDto {
  @ApiProperty({ example: [BusinessNearMeDto] })
  businesses: BusinessNearMeDto[];
  @ApiProperty({ example: 1 })
  page: number;
  @ApiProperty({ example: 5 })
  limit: number;
}
