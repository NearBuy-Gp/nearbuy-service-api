import { ItemType } from '../../../item/enums/item-type.enum';
export class NormalizeOutputDto {
  name: string;
  description?: string;
  price: number;
  images?: string[];
  isAvailable: boolean;
  businessId: string;
  type: ItemType;
  category?: string;
  attributes: any;
}
