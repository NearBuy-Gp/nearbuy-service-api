import { ApiProperty } from '@nestjs/swagger';
import { PaginatedItemsResponseDto } from '../../../item/dtos/response/paginated-items-response.dto';
import { Business } from '../../schemas/buisness.schema';
import { BusinessResponseDto } from './business-response.dto';

/**
 * Public business view. Identical to {@link BusinessResponseDto} (same fields,
 * same empty-value conventions) plus the paginated items list.
 */
export class BusinessWithItemsResponseDto extends BusinessResponseDto {
  @ApiProperty({ type: PaginatedItemsResponseDto, description: 'Paginated business items' })
  itemsPaginated: PaginatedItemsResponseDto;

  static fromEntity(entity: Business | any, itemsPaginated?: PaginatedItemsResponseDto): BusinessWithItemsResponseDto {
    const dto = BusinessResponseDto.assign(new BusinessWithItemsResponseDto(), entity);
    dto.itemsPaginated = itemsPaginated as PaginatedItemsResponseDto;
    return dto;
  }
}
