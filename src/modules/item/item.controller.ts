import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ItemService } from './item.service';
import { ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../../utils/enums/user-role.enum';
import {
  CreateClassSessionDto,
  CreateClinicServiceDto,
  CreateClothingProductDto,
  CreatePharmacyProductDto,
  CreateRestaurantItemDto,
  CreateSupermarketProductDto,
} from './dtos/requests/create-item.dto';
import { User } from '../../common/decorators/user.decorator';
import {
  UpdateClassSessionDto,
  UpdateClinicServiceDto,
  UpdateClothingProductDto,
  UpdatePharmacyProductDto,
  UpdateRestaurantItemDto,
  UpdateSupermarketProductDto,
} from './dtos/requests/update-item.dto';
import { DiscriminatedItemValidationPipe } from './pipes/discriminated-validation.pipe';
import { DiscriminatedBulkValidationPipe } from './pipes/discriminated-bulk-validation.pipe';
import { ClassSessionAttributesDto } from './dtos/requests/class-session.dto';
import { ClinicServiceAttributesDto } from './dtos/requests/clinic-serivce.dto';
import { ClothingProductAttributesDto } from './dtos/requests/cloths-product.dto';
import { PharmacyProductAttributesDto } from './dtos/requests/pharmacy-product.dto';
import { RestaurantItemAttributesDto } from './dtos/requests/resturant-item.dto';
import { SupermarketProductAttributesDto } from './dtos/requests/supermarket-porduct.dto';
import { Item } from './schemas/item.schema';
import { Roles } from '../../decorators/roles.decorator';

@ApiTags('Item')
@ApiExtraModels(
  CreateRestaurantItemDto,
  CreateClinicServiceDto,
  CreateClassSessionDto,
  CreatePharmacyProductDto,
  CreateSupermarketProductDto,
  CreateClothingProductDto,
  RestaurantItemAttributesDto,
  ClinicServiceAttributesDto,
  ClassSessionAttributesDto,
  PharmacyProductAttributesDto,
  SupermarketProductAttributesDto,
  ClothingProductAttributesDto,
)
@Controller(':businessId/item')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('/add-manual')
  @ApiOperation({ summary: 'Add Item' })
  @ApiResponse({ status: 200, description: 'Item Added Successfully' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateRestaurantItemDto) },
        { $ref: getSchemaPath(CreateClinicServiceDto) },
        { $ref: getSchemaPath(CreateClassSessionDto) },
        { $ref: getSchemaPath(CreatePharmacyProductDto) },
        { $ref: getSchemaPath(CreateSupermarketProductDto) },
        { $ref: getSchemaPath(CreateClothingProductDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          RESTAURANT: getSchemaPath(CreateRestaurantItemDto),
          CLINIC: getSchemaPath(CreateClinicServiceDto),
          CLASS: getSchemaPath(CreateClassSessionDto),
          PHARMACY: getSchemaPath(CreatePharmacyProductDto),
          SUPERMARKET: getSchemaPath(CreateSupermarketProductDto),
          CLOTHING: getSchemaPath(CreateClothingProductDto),
        },
      },
    },
    description: 'Item payload varies based on type',
  })
  public async addItemManual(
    @Param('businessId') businessId: string,
    @User('id') userId: string,
    @Body(new DiscriminatedItemValidationPipe())
    item: CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto,
  ) {
    return await this.itemService.addItemManual(businessId, userId, item);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('/add-bulk')
  @ApiOperation({ summary: 'Add Multiple Items (from upload)' })
  @ApiResponse({ status: 200, description: 'Items Added Successfully' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateRestaurantItemDto) },
        { $ref: getSchemaPath(CreateClinicServiceDto) },
        { $ref: getSchemaPath(CreateClassSessionDto) },
        { $ref: getSchemaPath(CreatePharmacyProductDto) },
        { $ref: getSchemaPath(CreateSupermarketProductDto) },
        { $ref: getSchemaPath(CreateClothingProductDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          RESTAURANT: getSchemaPath(CreateRestaurantItemDto),
          CLINIC: getSchemaPath(CreateClinicServiceDto),
          CLASS: getSchemaPath(CreateClassSessionDto),
          PHARMACY: getSchemaPath(CreatePharmacyProductDto),
          SUPERMARKET: getSchemaPath(CreateSupermarketProductDto),
          CLOTHING: getSchemaPath(CreateClothingProductDto),
        },
      },
    },
    description: 'Item payload varies based on type',
  })
  public async addItemsBulk(
    @Param('businessId') businessId: string,
    @User('id') userId: string,
    @Body(new DiscriminatedBulkValidationPipe())
    items: CreateRestaurantItemDto[] | CreateClinicServiceDto[] | CreateClassSessionDto[] | CreatePharmacyProductDto[] | CreateSupermarketProductDto[] | CreateClothingProductDto[],
  ) {
    return await this.itemService.addItemsBulk(businessId, userId, items);
  }

  @Roles(Role.OWNER)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('/:itemId')
  @ApiOperation({ summary: 'View Item' })
  @ApiResponse({ status: 200, description: 'Item Details' })
  public getItem(@Param('businessId') businessId: string, @Param('itemId') itemId: string, @User('id') userId: string): Promise<Item> {
    return this.itemService.getItem(userId, businessId, itemId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Patch('/:itemId')
  @ApiOperation({ summary: 'Update Item' })
  @ApiResponse({ status: 200, description: 'Item Update Details' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateRestaurantItemDto) },
        { $ref: getSchemaPath(CreateClinicServiceDto) },
        { $ref: getSchemaPath(CreateClassSessionDto) },
        { $ref: getSchemaPath(CreatePharmacyProductDto) },
        { $ref: getSchemaPath(CreateSupermarketProductDto) },
        { $ref: getSchemaPath(CreateClothingProductDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          RESTAURANT: getSchemaPath(CreateRestaurantItemDto),
          CLINIC: getSchemaPath(CreateClinicServiceDto),
          CLASS: getSchemaPath(CreateClassSessionDto),
          PHARMACY: getSchemaPath(CreatePharmacyProductDto),
          SUPERMARKET: getSchemaPath(CreateSupermarketProductDto),
          CLOTHING: getSchemaPath(CreateClothingProductDto),
        },
      },
    },
    description: 'Item payload varies based on type',
  })
  public updateItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @User('id') userId: string,
    @Body()
    item: UpdateRestaurantItemDto | UpdateClinicServiceDto | UpdateClassSessionDto | UpdatePharmacyProductDto | UpdateSupermarketProductDto | UpdateClothingProductDto,
  ) {
    return this.itemService.updateItem(userId, businessId, itemId, item);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Delete('/:itemId')
  @ApiOperation({ summary: 'Delete Item' })
  @ApiResponse({ status: 200, description: 'Item Deleted Successfully' })
  public deleteItem(@Param('businessId') businessId: string, @Param('itemId') itemId: string, @User('id') userId: string) {
    return this.itemService.deleteItem(userId, businessId, itemId);
  }
}
