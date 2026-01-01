import { Item } from '../../schemas/item.schema';

export class ItemResponseDto {
  message: string;
  item: Item;
}
