import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ItemType } from '../item/enums/item-type.enum';
import { Types } from 'mongoose';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel('Category') private categoryModel,
    @InjectModel('Item') private itemModel,
    @InjectModel('Business') private businessModel,
  ) {}

  public async getCategoriesByItemType(itemType: ItemType) {
    return await this.categoryModel.find({ itemType }).exec();
  }

  public async getBusinessCategories(businessId: string) {
    await this.validateBusiness(businessId);

    const categoryIds: Types.ObjectId[] = await this.itemModel.distinct('categoryId', { businessId });
    if (!categoryIds.length) return [];

    const validCategories = await this.categoryModel.find({
      _id: { $in: categoryIds },
    });

    return validCategories;
  }
  private async validateBusiness(businessId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business) {
      throw new BadRequestException('Business not found');
    }
  }
}
