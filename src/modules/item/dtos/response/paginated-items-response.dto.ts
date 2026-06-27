import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto } from './item.response.dto';

export class PaginatedItemsResponseDto {
  @ApiProperty({
    type: [ItemResponseDto],
    description: 'Array of items with unified, type-documented shape',
  })
  items: ItemResponseDto[];

  @ApiProperty({
    example: 50,
    description: 'Total number of items',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Items per page',
  })
  limit: number;

  static fromEntity(entity: any): PaginatedItemsResponseDto {
    const dto = new PaginatedItemsResponseDto();
    dto.items = (entity.items ?? []).map((item: any) => ItemResponseDto.fromEntity(item));
    dto.total = entity.total;
    dto.page = entity.page;
    dto.limit = entity.limit;
    return dto;
  }
}
