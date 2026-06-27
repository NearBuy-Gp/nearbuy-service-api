// create-product-view.dto.ts
import { IsMongoId } from 'class-validator';

export class CreateProductViewDto {
  @IsMongoId()
  businessId: string;

  @IsMongoId()
  productId: string;
}