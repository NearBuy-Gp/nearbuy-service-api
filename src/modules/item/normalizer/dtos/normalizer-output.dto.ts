import { ItemType } from "../../enums/item-type.enum";

export class NormalizeOutputDto {
  name: string;
  description?: string;
  price: number;
  images?: string[];
  isAvailable: boolean;
  businessId: string;
  type: ItemType;
  attributes: any;
}