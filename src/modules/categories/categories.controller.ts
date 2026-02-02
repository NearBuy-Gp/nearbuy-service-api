import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ItemType } from '../item/enums/item-type.enum';
import { Category } from './schemas/categories.schema';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}
  @ApiOperation({ summary: 'Get categories by item type' })
  @ApiResponse({
    status: 200,
    description: 'Get categories by item type',
    type: [Category],
  })
  @Get('/:itemType')
  public async getCategoriesByItemType(@Param('itemType') itemType: ItemType) {
    return this.categoriesService.getCategoriesByItemType(itemType);
  }
  @ApiOperation({ summary: 'Get categories by business id' })
  @ApiResponse({
    status: 200,
    description: 'Get categories by business id',
    type: [Category],
  })
  @Get('/business/:businessId')
  public async getBusinessCategories(@Param('businessId') businessId: string) {
    return this.categoriesService.getBusinessCategories(businessId);
  }
}
