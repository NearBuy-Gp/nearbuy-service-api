import { ItemType } from '../../item/enums/item-type.enum';
import { SizeEnum } from '../../item/enums/size.enum';

export interface RestaurantAttributes {
  menuCategory?: string;
  tags?: string[];
}

export interface ClinicAttributes {
  doctorName?: string;
  doctorSpecialization?: string;
}

export interface ClassSessionAttributes {
  trainerName?: string;
  intensityLevel?: string;
  accessLevel?: string;
  benefits?: string[];
}

export interface PharmacyAttributes {
  brand?: string;
  dosageForm?: string;
  activeIngredients?: string[];
  packageSize?: string;
}

export interface SupermarketAttributes {
  brand?: string;
  weight?: string;
}

export interface ClothingAttributes {
  brand?: string;
  material?: string;
  sizes?: SizeEnum[];
  colorsAvailable?: string[];
}

export type ItemAttributes = RestaurantAttributes | ClinicAttributes | ClassSessionAttributes | PharmacyAttributes | SupermarketAttributes | ClothingAttributes;

export interface BusinessDto {
  name: string;
  category: string;
  type: string;
  description?: string;
  tags?: string[];
}

export interface SemanticSearchItemRequestDto {
  item_id: string;
  item_type: ItemType;
  name: string;
  description?: string;
  price: number;
  attributes: ItemAttributes;
  business: BusinessDto;
}
