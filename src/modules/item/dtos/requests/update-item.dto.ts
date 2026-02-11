import { PartialType } from '@nestjs/swagger';
import { CreateClassSessionDto, CreateClinicServiceDto, CreateClothingProductDto, CreatePharmacyProductDto, CreateRestaurantItemDto, CreateSupermarketProductDto } from './create-item.dto';

export class UpdateRestaurantItemDto extends PartialType(CreateRestaurantItemDto) {}
export class UpdateClinicServiceDto extends PartialType(CreateClinicServiceDto) {}
export class UpdateClassSessionDto extends PartialType(CreateClassSessionDto) {}
export class UpdatePharmacyProductDto extends PartialType(CreatePharmacyProductDto) {}
export class UpdateSupermarketProductDto extends PartialType(CreateSupermarketProductDto) {}
export class UpdateClothingProductDto extends PartialType(CreateClothingProductDto) {}
