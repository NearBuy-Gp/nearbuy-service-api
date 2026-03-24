import { Injectable } from '@nestjs/common';
import {
  CreateRestaurantItemDto,
  CreateClinicServiceDto,
  CreateClassSessionDto,
  CreatePharmacyProductDto,
  CreateClothingProductDto,
  CreateSupermarketProductDto,
} from 'src/modules/item/dtos/requests/create-item.dto';
import { Business } from 'src/modules/business/schemas/buisness.schema';

@Injectable()
export class EmbeddingTextBuilder {
  build(
    item: CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto,
    business: Business,
  ): string {
    const parts: string[] = [item.name, item.description ?? '', business.category, business.name, business.type, ...(business.tags ?? [])];

    if (item instanceof CreateClinicServiceDto) {
      parts.push(item.attributes.doctorSpecialization ?? '');
      parts.push(item.attributes.doctorName ?? '');
    } else if (item instanceof CreateRestaurantItemDto) {
      parts.push(item.attributes.menuCategory ?? '');
      parts.push(...(item.attributes.tags ?? []));
    } else if (item instanceof CreateClassSessionDto) {
      parts.push(item.attributes.trainerName ?? '');
    } else if (item instanceof CreatePharmacyProductDto) {
      parts.push(...(item.attributes.activeIngredients ?? []));
      parts.push(item.attributes.brand ?? '');
    } else if (item instanceof CreateClothingProductDto) {
      parts.push(item.attributes.material ?? '');
      parts.push(item.attributes.brand ?? '');
    } else if (item instanceof CreateSupermarketProductDto) {
      parts.push(item.attributes.brand ?? '');
    }

    return parts.filter(Boolean).join(' ').toLowerCase().trim();
  }
  //   semanticFieldsChanged(dto: Partial<CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto>, business: Business): boolean {
  //     const semanticFields: (keyof CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto )[] = [
  //       'name',
  //       'description',
  //       'businessCategory',
  //       'businessName',
  //       'businessType',
  //       'doctorSpecialization',
  //       'doctorName',
  //       'trainerName',
  //       'activeIngredients',
  //       'material',
  //       'tags',
  //       'benefits',
  //       'menuCategory',
  //       'brand',
  //     ];
  //     return semanticFields.some((field) => field in dto);
  //   }
}
