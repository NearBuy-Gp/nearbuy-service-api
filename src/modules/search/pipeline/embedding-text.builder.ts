import { Injectable } from '@nestjs/common';
import { Business } from '../../business/schemas/buisness.schema';
import {
  CreateRestaurantItemDto,
  CreateClinicServiceDto,
  CreateClassSessionDto,
  CreatePharmacyProductDto,
  CreateSupermarketProductDto,
  CreateClothingProductDto,
  CreateElectronicsProductDto,
} from '../../item/dtos/requests/create-item.dto';
import {
  SemanticSearchItemRequestDto,
  RestaurantAttributes,
  ClinicAttributes,
  ClassSessionAttributes,
  PharmacyAttributes,
  SupermarketAttributes,
  ClothingAttributes,
  ElectronicsAttributes,
} from '../interfaces/semantic-search-request.interface';
import { ItemType } from '../../item/enums/item-type.enum';

type CreateItemDto =
  | CreateRestaurantItemDto
  | CreateClinicServiceDto
  | CreateClassSessionDto
  | CreatePharmacyProductDto
  | CreateSupermarketProductDto
  | CreateClothingProductDto
  | CreateElectronicsProductDto;

@Injectable()
export class EmbeddingTextBuilder {
  public buildRequestBody(item: CreateItemDto, business: Business): SemanticSearchItemRequestDto {
    return {
      item_id: (item as any)._id?.toString() ?? '',
      item_type: this.resolveItemType(item),
      name: item.name,
      description: item.description ?? undefined,
      price: item.price,
      attributes: this.buildAttributes(item),
      business: {
        name: business.name,
        category: business.category,
        type: business.type,
        description: business.description ?? undefined,
        tags: business.tags?.length ? business.tags : undefined,
      },
    };
  }

  public build(item: CreateItemDto, business: Business): string {
    const payload = this.buildRequestBody(item, business);
    const parts: string[] = [payload.name, payload.description ?? '', payload.business.category, payload.business.name, payload.business.type, ...(payload.business.tags ?? [])];

    const a = payload.attributes as any;

    switch (payload.item_type) {
      case ItemType.CLINIC:
        parts.push(a.doctorSpecialization ?? '');
        parts.push(a.doctorName ?? '');
        break;
      case ItemType.RESTAURANT:
        parts.push(a.menuCategory ?? '');
        parts.push(...(a.tags ?? []));
        break;
      case ItemType.CLASS_SESSION:
        parts.push(a.trainerName ?? '');
        break;
      case ItemType.PHARMACY_PRODUCT:
        parts.push(...(a.activeIngredients ?? []));
        parts.push(a.brand ?? '');
        break;
      case ItemType.CLOTHING_PRODUCT:
        parts.push(a.material ?? '');
        parts.push(a.brand ?? '');
        break;
      case ItemType.SUPER_MARKET_PRODUCT:
        parts.push(a.brand ?? '');
        break;
      case ItemType.ELECTRONICS_PRODUCT:
        parts.push(a.brand ?? '');
        parts.push(a.model ?? '');
        break;
    }

    return parts.filter(Boolean).join(' ').toLowerCase().trim();
  }

  private resolveItemType(item: CreateItemDto): ItemType {
    // Primary: class instance checks (used by API controllers)
    if (item instanceof CreateRestaurantItemDto) return ItemType.RESTAURANT;
    if (item instanceof CreateClinicServiceDto) return ItemType.CLINIC;
    if (item instanceof CreateClassSessionDto) return ItemType.CLASS_SESSION;
    if (item instanceof CreatePharmacyProductDto) return ItemType.PHARMACY_PRODUCT;
    if (item instanceof CreateSupermarketProductDto) return ItemType.SUPER_MARKET_PRODUCT;
    if (item instanceof CreateClothingProductDto) return ItemType.CLOTHING_PRODUCT;
    if (item instanceof CreateElectronicsProductDto) return ItemType.ELECTRONICS_PRODUCT;

    // Fallback: plain object with a `type` field (used by seed scripts)
    const rawType = (item as any).type;
    if (rawType && Object.values(ItemType).includes(rawType)) {
      return rawType as ItemType;
    }

    throw new Error(`Unknown item type: ${JSON.stringify(item)}`);
  }

  private buildAttributes(item: CreateItemDto) {
    // Primary: class instance checks
    if (item instanceof CreateRestaurantItemDto) return this.buildRestaurantAttributes(item);
    if (item instanceof CreateClinicServiceDto) return this.buildClinicAttributes(item);
    if (item instanceof CreateClassSessionDto) return this.buildClassSessionAttributes(item);
    if (item instanceof CreatePharmacyProductDto) return this.buildPharmacyAttributes(item);
    if (item instanceof CreateSupermarketProductDto) return this.buildSupermarketAttributes(item);
    if (item instanceof CreateClothingProductDto) return this.buildClothingAttributes(item);
    if (item instanceof CreateElectronicsProductDto) return this.buildElectronicsAttributes(item);

    // Fallback: plain object — dispatch by resolved type
    const type = this.resolveItemType(item);
    const a = (item as any).attributes ?? {};

    switch (type) {
      case ItemType.RESTAURANT:
        return {
          ...(a.menuCategory && { menuCategory: a.menuCategory }),
          ...(a.tags?.length && { tags: a.tags }),
        } as RestaurantAttributes;

      case ItemType.CLINIC:
        return {
          ...(a.doctorName && { doctorName: a.doctorName }),
          ...(a.doctorSpecialization && { doctorSpecialization: a.doctorSpecialization }),
        } as ClinicAttributes;

      case ItemType.CLASS_SESSION:
        return {
          ...(a.trainerName && { trainerName: a.trainerName }),
          ...(a.intensityLevel && { intensityLevel: a.intensityLevel }),
        } as ClassSessionAttributes;

      case ItemType.PHARMACY_PRODUCT:
        return {
          ...(a.brand && { brand: a.brand }),
          ...(a.dosageForm && { dosageForm: a.dosageForm }),
          ...(a.activeIngredients?.length && { activeIngredients: a.activeIngredients }),
          ...(a.packageSize && { packageSize: a.packageSize }),
        } as PharmacyAttributes;

      case ItemType.SUPER_MARKET_PRODUCT:
        return {
          ...(a.brand && { brand: a.brand }),
          ...(a.weight && { weight: a.weight }),
        } as SupermarketAttributes;

      case ItemType.ELECTRONICS_PRODUCT:
        return {
          ...(a.brand && { brand: a.brand }),
          ...(a.model && { model: a.model }),
          ...(a.warranty && { warranty: a.warranty }),
        } as ElectronicsAttributes;

      case ItemType.CLOTHING_PRODUCT:
        return {
          ...(a.brand && { brand: a.brand }),
          ...(a.material && { material: a.material }),
          ...(a.sizes && { sizes: a.sizes }),
          ...(a.colorsAvailable?.length && { colorsAvailable: a.colorsAvailable }),
        } as ClothingAttributes;

      default:
        throw new Error(`Cannot build attributes for type: ${type}`);
    }
  }

  private buildRestaurantAttributes(item: CreateRestaurantItemDto): RestaurantAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.menuCategory && { menuCategory: a.menuCategory }),
      ...(a.tags?.length && { tags: a.tags }),
    };
  }

  private buildClinicAttributes(item: CreateClinicServiceDto): ClinicAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.doctorName && { doctorName: a.doctorName }),
      ...(a.doctorSpecialization && { doctorSpecialization: a.doctorSpecialization }),
    };
  }

  private buildClassSessionAttributes(item: CreateClassSessionDto): ClassSessionAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.trainerName && { trainerName: a.trainerName }),
      ...(a.intensityLevel && { intensityLevel: a.intensityLevel }),
    };
  }

  private buildPharmacyAttributes(item: CreatePharmacyProductDto): PharmacyAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.brand && { brand: a.brand }),
      ...(a.dosageForm && { dosageForm: a.dosageForm }),
      ...(a.activeIngredients?.length && { activeIngredients: a.activeIngredients }),
      ...(a.packageSize && { packageSize: a.packageSize }),
    };
  }

  private buildSupermarketAttributes(item: CreateSupermarketProductDto): SupermarketAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.brand && { brand: a.brand }),
      ...(a.weight && { weight: a.weight }),
    };
  }

  private buildClothingAttributes(item: CreateClothingProductDto): ClothingAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.brand && { brand: a.brand }),
      ...(a.material && { material: a.material }),
      ...(a.sizes && { sizes: a.sizes }),
      ...(a.colorsAvailable?.length && { colorsAvailable: a.colorsAvailable }),
    };
  }

  private buildElectronicsAttributes(item: CreateElectronicsProductDto): ElectronicsAttributes {
    const a = item.attributes;
    if (!a) return {};
    return {
      ...(a.brand && { brand: a.brand }),
      ...(a.model && { model: a.model }),
      ...(a.warranty && { warranty: a.warranty }),
    };
  }
}
