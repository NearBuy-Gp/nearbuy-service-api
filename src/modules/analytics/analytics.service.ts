
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Model, Types } from 'mongoose';

import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from './schemas/analytics-event.schema';

import {
  Business,
} from '../business/schemas/buisness.schema';

import { Item } from '../item/schemas/item.schema'


import { CreateProfileViewDto } from './dto/create-profile-view.dto';
import { CreateProductViewDto } from './dto/create-product-view.dto';


@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsModel: Model<AnalyticsEventDocument>,

    @InjectModel(Business.name)
    private readonly businessModel: Model<Business>,

    @InjectModel(Item.name)
    private itemModel: Model<Item>,
  ) { }

  async createProfileView(
    dto: CreateProfileViewDto,
    userId: string,
  ) {
    // 1) business exist
    const business =
      await this.businessModel.findById(
        dto.businessId,
      );

    if (!business) {
      throw new NotFoundException(
        'Business not found',
      );
    }


    if (
      business.ownerId.toString() ===
      userId.toString()
    ) {
      return {
        success: true,
        message: 'Owner visit ignored',
      };
    }

    // 3) not new visit during 30 min

    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000,
    );

    const existingVisit =
      await this.analyticsModel.findOne({
        eventType: 'PROFILE_VIEW',
        businessId: dto.businessId,
        userId,
        createdAt: {
          $gte: thirtyMinutesAgo,
        },
      });

    if (existingVisit) {
      return {
        success: true,
        message:
          'Visit already recorded recently',
      };
    }

    // 4)  new one

    return this.analyticsModel.create({
      eventType: 'PROFILE_VIEW',
      businessId: dto.businessId,
      userId,
    });
  }


  async getProfileVisits(businessId: string, userId: string) {
    const business = await this.businessModel.findById(businessId);

    if (!business) throw new NotFoundException('Business not found');

    if (business.ownerId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied');
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [totalVisits, todayVisits, thisWeekVisits] = await Promise.all([
      this.analyticsModel.countDocuments({
        eventType: 'PROFILE_VIEW',
        businessId,
      }),
      this.analyticsModel.countDocuments({
        eventType: 'PROFILE_VIEW',
        businessId,
        createdAt: { $gte: startOfToday },
      }),
      this.analyticsModel.countDocuments({
        eventType: 'PROFILE_VIEW',
        businessId,
        createdAt: { $gte: startOfWeek },
      }),
    ]);

    return { totalVisits, todayVisits, thisWeekVisits };
  }


  async createProductView(dto: CreateProductViewDto, userId: string) {
    const business = await this.businessModel.findById(dto.businessId);
    if (!business) throw new NotFoundException('Business not found');


    const item = await this.itemModel.findOne({
      _id: dto.productId,
      businessId: dto.businessId,
    });
    if (!item) throw new NotFoundException('Product not found in this business');


    // ignore owner
    if (business.ownerId.toString() === userId.toString()) {
      return { success: true, message: 'Owner visit ignored' };
    }

    // dedup 30 min
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await this.analyticsModel.findOne({
      eventType: 'PRODUCT_VIEW',
      productId: dto.productId,
      userId,
      createdAt: { $gte: thirtyMinutesAgo },
    });

    if (existing) {
      return { success: true, message: 'Visit already recorded recently' };
    }

    return this.analyticsModel.create({
      eventType: 'PRODUCT_VIEW',
      businessId: dto.businessId,
      productId: dto.productId,
      userId,
    });
  }

  async getTopProducts(businessId: string, userId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied');
    }

    return this.analyticsModel.aggregate([
      {
        $match: {
          eventType: 'PRODUCT_VIEW',
          businessId: new Types.ObjectId(businessId),
        },
      },
      {
        $group: {
          _id: '$productId',
          totalViews: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$product.name',
          totalViews: 1,
        },
      },
      { $sort: { totalViews: -1 } },
      { $limit: 10 },
    ]);
  }


  async getNearbyCompetition(businessId: string, userId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied');
    }

    const competitors = await this.businessModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: business.location.coordinates,
          },
          distanceField: 'distance', //in meters
          maxDistance: 5000,
          query: {
            _id: { $ne: business._id },
            category: business.category,
          },
          spherical: true,
        },
      },
      {
        $project: {
          name: 1,
          address: 1,
          rate: 1,
          category: 1,
          distance: { $round: ['$distance', 0] }, // meters
        },
      },
    ]);

    return {
      totalCompetitors: competitors.length,
      radius: '5km',
      category: business.category,
      competitors,
    };
  }


  async getAudienceAnalytics(businessId: string, userId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId.toString() !== userId.toString()) {
      throw new ForbiddenException('Access denied');
    }

    const businessObjectId = new Types.ObjectId(businessId);

    const [ageGroups, userTypes, interests] = await Promise.all([
      // Age Groups
      this.analyticsModel.aggregate([
        { $match: { eventType: 'PROFILE_VIEW', businessId: businessObjectId } },
        { $group: { _id: '$userId' } }, // remove deduplicate 
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },

        {
          $match: {
            'user.age': {
              $exists: true,
              $ne: null,
              $gte: 18,
            },
          },
        },
        {
          $bucket: {
            groupBy: '$user.age',
            boundaries: [18, 25, 35, 45, 60],
            default: '60+',
            output: { count: { $sum: 1 } },
          },
        },
        {
          $project: {
            _id: 0,
            ageRange: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 18] }, then: '18-24' },
                  { case: { $eq: ['$_id', 25] }, then: '25-34' },
                  { case: { $eq: ['$_id', 35] }, then: '35-44' },
                  { case: { $eq: ['$_id', 45] }, then: '45-59' },
                ],
                default: '60+',
              },
            },
            count: 1,
          },
        },
      ]),

      // User Types
      this.analyticsModel.aggregate([
        { $match: { eventType: 'PROFILE_VIEW', businessId: businessObjectId } },
        { $group: { _id: '$userId' } }, // ✅ deduplicate
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $group: { _id: '$user.userType', count: { $sum: 1 } } },
        { $project: { _id: 0, type: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]),

      // Interests
      this.analyticsModel.aggregate([
        { $match: { eventType: 'PROFILE_VIEW', businessId: businessObjectId } },
        { $group: { _id: '$userId' } }, // ✅ deduplicate
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $unwind: '$user.interests' },
        { $group: { _id: '$user.interests', count: { $sum: 1 } } },
        { $project: { _id: 0, interest: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return { ageGroups, userTypes, interests };
  }

}