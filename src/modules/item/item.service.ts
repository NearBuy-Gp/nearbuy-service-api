import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  CreateClassSessionDto,
  CreateClinicServiceDto,
  CreateClothingProductDto,
  CreatePharmacyProductDto,
  CreateRestaurantItemDto,
  CreateSupermarketProductDto,
} from './dtos/requests/create-item.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business } from '../business/schemas/buisness.schema';
import { User } from '../user/schemas/user.schema';
import { Item } from './schemas/item.schema';
import { UpdateClothingProductDto, UpdateRestaurantItemDto, UpdateSupermarketProductDto } from './dtos/requests/update-item.dto';
import { UpdateClinicServiceDto } from './dtos/requests/update-item.dto';
import { UpdateClassSessionDto } from './dtos/requests/update-item.dto';
import { UpdatePharmacyProductDto } from './dtos/requests/update-item.dto';

@Injectable()
export class ItemService {
  strategyFactory: any;
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
  ) {}
  public async addItemManual(
    businessId: string,
    ownerId: string,
    item: CreateRestaurantItemDto | CreateClinicServiceDto | CreateClassSessionDto | CreatePharmacyProductDto | CreateSupermarketProductDto | CreateClothingProductDto,
  ) {
    const business = await this.validateBusiness(ownerId, businessId);

    const newItem = await this.itemModel.create({
      ...item,
      businessId: business._id,
    });
    return { message: 'Item Added Successfully', item: newItem };
  }

  //  public async addItemsBulk(
  //   businessId: string,
  //   ownerId: string,
  //   items: CreateItemDto[],
  // ) {
  //   if (!items || items.length === 0) {
  //     throw new BadRequestException('No items to insert');
  //   }
  //   const business = await this.validateBusiness(ownerId, businessId);
  //   const itemsWithBusinessId = items.map(item => ({
  //     ...item,
  //     businessId: business._id,
  //   }));
  //   const insertedItems = await this.itemModel.insertMany(itemsWithBusinessId);
  //   return {
  //     message: 'Items Added Successfully',
  //     count: insertedItems.length,
  //     items: insertedItems,
  //   };
  // }
  public async deleteItem(ownerId: string, businessId: string, itemId: string) {
    const business = await this.validateBusiness(ownerId, businessId);
    await this.itemModel.findByIdAndDelete({
      _id: itemId,
      businessId: business._id,
    });
    return { message: 'Item Deleted Successfully' };
  }
  public async getItem(ownerId: string, businessId: string, itemId: string): Promise<Item> {
    const business = await this.validateBusiness(ownerId, businessId);
    const item = await this.itemModel.findOne({
      _id: itemId,
      businessId: business._id,
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }
  public async updateItem(
    ownerId: string,
    businessId: string,
    itemId: string,
    itemDetails: UpdateRestaurantItemDto | UpdateClinicServiceDto | UpdateClassSessionDto | UpdatePharmacyProductDto | UpdateSupermarketProductDto | UpdateClothingProductDto,
  ): Promise<Item> {
    const business = await this.validateBusiness(ownerId, businessId);
    const item = await this.itemModel.findOne({
      _id: itemId,
      businessId: business._id,
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    const updatedItem = await this.itemModel.findByIdAndUpdate(item._id, { $set: itemDetails }, { new: true });
    if (!updatedItem) {
      throw new NotFoundException('Item not found');
    }
    return updatedItem;
  }
  public async bulkDeleteItem(ownerId: string, businessId: string, itemId: string, itemsIds: string[]) {
    const business = await this.validateBusiness(ownerId, businessId);
    await this.itemModel.deleteMany({
      businessId: business._id,
      _id: { $in: itemsIds },
    });
    return { message: 'Items Deleted Successfully' };
  }

  private async validateBusiness(ownerId: string, businessId: string): Promise<Business> {
    const business = await this.businessModel.findOne({
      _id: businessId,
      ownerId,
    });
    if (!business) {
      throw new UnauthorizedException('Business not found');
    }

    return business;
  }
}
