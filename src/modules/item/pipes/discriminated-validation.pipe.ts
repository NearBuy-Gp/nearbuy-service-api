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
export class DiscriminatedItemValidationPipe implements PipeTransform {
  private readonly dtoMapping = {
    [ItemType.RESTAURANT]: CreateRestaurantItemDto,
    [ItemType.CLINIC]: CreateClinicServiceDto,
    [ItemType.CLASS_SESSION]: CreateClassSessionDto,
    [ItemType.PHARMACY_PRODUCT]: CreatePharmacyProductDto,
    [ItemType.SUPER_MARKET_PRODUCT]: CreateSupermarketProductDto,
    [ItemType.CLOTHING_PRODUCT]: CreateClothingProductDto,
  };

  async transform(value: any) {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    if (!value.type) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            property: 'type',
            constraints: {
              isEnum: `type be one of the following values: ${Object.keys(this.dtoMapping).join(', ')}`,
            },
          },
        ],
      });
    }

    const normalizedType = value.type;

    if (!this.dtoMapping[normalizedType]) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            property: 'type',
            value: value.type,
            constraints: {
              isEnum: `type must be one of the following values: ${Object.keys(this.dtoMapping).join(', ')}`,
            },
          },
        ],
      });
    }

    const DtoClass = this.dtoMapping[normalizedType];

    const dtoInstance = plainToInstance(
      DtoClass,
      { ...value, type: normalizedType },
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

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return dtoInstance;
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
