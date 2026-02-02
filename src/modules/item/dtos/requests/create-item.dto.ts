import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassSessionAttributesDto } from './class-session.dto';
import { ClinicServiceAttributesDto } from './clinic-serivce.dto';
import { CreateItemBaseDto } from './create-item-base.dto';
import { PharmacyProductAttributesDto } from './pharmacy-product.dto';
import { RestaurantItemAttributesDto } from './resturant-item.dto';
import { SupermarketProductAttributesDto } from './supermarket-porduct.dto';
import { ClothingProductAttributesDto } from './cloths-product.dto';

@ApiExtraModels(RestaurantItemAttributesDto, ClinicServiceAttributesDto, ClassSessionAttributesDto, PharmacyProductAttributesDto)
export class CreateRestaurantItemDto extends CreateItemBaseDto {
  @ApiProperty({ type: RestaurantItemAttributesDto })
  @ValidateNested()
  @Type(() => RestaurantItemAttributesDto)
  attributes: RestaurantItemAttributesDto;
}

export class CreateClinicServiceDto extends CreateItemBaseDto {
  @ApiProperty({ type: ClinicServiceAttributesDto })
  @ValidateNested()
  @Type(() => ClinicServiceAttributesDto)
  attributes: ClinicServiceAttributesDto;
}
export class CreateClassSessionDto extends CreateItemBaseDto {
  @ApiProperty({ type: ClassSessionAttributesDto })
  @ValidateNested()
  @Type(() => ClassSessionAttributesDto)
  attributes: ClassSessionAttributesDto;
}
export class CreatePharmacyProductDto extends CreateItemBaseDto {
  @ApiProperty({ type: PharmacyProductAttributesDto })
  @ValidateNested()
  @Type(() => PharmacyProductAttributesDto)
  attributes: PharmacyProductAttributesDto;
}
export class CreateSupermarketProductDto extends CreateItemBaseDto {
  @ApiProperty({ type: SupermarketProductAttributesDto })
  @ValidateNested()
  @Type(() => SupermarketProductAttributesDto)
  attributes: SupermarketProductAttributesDto;
}
export class CreateClothingProductDto extends CreateItemBaseDto {
  @ApiProperty({ type: ClothingProductAttributesDto })
  @ValidateNested()
  @Type(() => ClothingProductAttributesDto)
  attributes: ClothingProductAttributesDto;
}
