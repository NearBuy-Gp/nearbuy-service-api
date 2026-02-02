import { ApiProperty } from '@nestjs/swagger';
import { Item } from '../../schemas/item.schema';

export class PaginatedItemsResponseDto {
  @ApiProperty({
    type: [Item],
    description: 'Array of items',
  })
  items: Item[];

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
    dto.items = entity.items;
    dto.total = entity.total;
    dto.page = entity.page;
    dto.limit = entity.limit;
    return dto;
  }
}
