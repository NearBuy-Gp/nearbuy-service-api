import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { ItemType } from '../enums/item-type.enum';
import {
  CreateClassSessionDto,
  CreateClinicServiceDto,
  CreateClothingProductDto,
  CreatePharmacyProductDto,
  CreateRestaurantItemDto,
  CreateSupermarketProductDto,
} from '../dtos/requests/create-item.dto';

@Injectable()
export class DiscriminatedBulkValidationPipe implements PipeTransform {
  private readonly dtoMapping = {
    [ItemType.RESTAURANT]: CreateRestaurantItemDto,
    [ItemType.CLINIC]: CreateClinicServiceDto,
    [ItemType.CLASS_SESSION]: CreateClassSessionDto,
    [ItemType.PHARMACY_PRODUCT]: CreatePharmacyProductDto,
    [ItemType.SUPER_MARKET_PRODUCT]: CreateSupermarketProductDto,
    [ItemType.CLOTHING_PRODUCT]: CreateClothingProductDto,
  };

  async transform(value: any) {
    if (!Array.isArray(value)) {
      throw new BadRequestException('Request body must be an array of items');
    }

    if (value.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const validatedItems: (CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto)[] = [];
    const bulkErrors: any[] = [];

    for (let index = 0; index < value.length; index++) {
      const item = value[index];

      if (!item || typeof item !== 'object') {
        bulkErrors.push({
          itemIndex: index,
          message: 'Item must be a valid object',
        });
        continue;
      }

      if (!item.type) {
        bulkErrors.push({
          itemIndex: index,
          property: 'type',
          message: `type is required and must be one of: ${Object.keys(this.dtoMapping).join(', ')}`,
        });
        continue;
      }

      const normalizedType = item.type;

      if (!this.dtoMapping[normalizedType]) {
        bulkErrors.push({
          itemIndex: index,
          property: 'type',
          value: item.type,
          message: `type must be one of: ${Object.keys(this.dtoMapping).join(', ')}`,
        });
        continue;
      }

      const DtoClass = this.dtoMapping[normalizedType];
      const dtoInstance = plainToInstance(
        DtoClass,
        { ...item, type: normalizedType },
        {
          enableImplicitConversion: true,
          excludeExtraneousValues: false,
        },
      );

      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        const formattedErrors = this.formatValidationErrors(errors);
        bulkErrors.push({
          itemIndex: index,
          errors: formattedErrors,
        });
      } else {
        validatedItems.push(
          dtoInstance as unknown as CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto,
        );
      }
    }

    if (bulkErrors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed for one or more items',
        totalItems: value.length,
        failedCount: bulkErrors.length,
        errors: bulkErrors,
      });
    }

    return validatedItems;
  }

  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.flatMap((error) => {
      if (error.children && error.children.length > 0) {
        return error.children.map((childError) => ({
          property: `${error.property}.${childError.property}`,
          value: childError.value,
          constraints: childError.constraints,
        }));
      }

      return {
        property: error.property,
        value: error.value,
        constraints: error.constraints,
      };
    });
  }
}
