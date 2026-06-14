import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRegistrationDto } from './dtos/request/business-registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Business } from './schemas/buisness.schema';
import { BusinessStatus } from './enums/business-status.enum';
import { RegisterBusinessResponseDto } from './dtos/response/register-business-response.dto';
import STATIC_MESSAGES from '../../config/staticMessages.json';
import { UpdateBusinessDto } from './dtos/request/business-update-request.dto';
import { BusinessOnMapDto } from './dtos/response/business-on-map.dto';
import { BusinessCategory } from './enums/business-category.enum';
import { BusinessDataDto } from './dtos/response/business-data.dto';
import { PaginatedBusinessNearMeDto } from './dtos/response/paginated-business-near-me';
import geohash from '../../utils/helpers/geohash';
import { PaginatedItemsResponseDto } from '../item/dtos/response/paginated-items-response.dto';
import { Item } from '../item/schemas/item.schema';
import { BusinessWithItemsResponseDto } from './dtos/response/business-with-items-response.dto';
import { BusinessResponseDto } from './dtos/response/business-response.dto';
import { BusinessType } from './enums/business-type.enum';
import {BusinessRateDto} from './dtos/request/business-rate.dto';


@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Item.name) private itemModel: Model<Item>,
  ) {}

  public async registerBusiness(createBusinessDto: BusinessRegistrationDto, ownerId: string): Promise<RegisterBusinessResponseDto> {
    const owner = await this.validateOwner(ownerId);
    const coordinates = createBusinessDto.location.coordinates.map(Number);
    if (coordinates.length !== 2) {
      throw new BadRequestException('Location coordinates must be an array of 2 numbers [longitude, latitude]');
    }
    const { full_geohash, geohash_country, geohash_region, geohash_city, geohash_district, geohash_neighborhood, geohash_street, geohash_building } = geohash.generateGeoHashes(
      coordinates[0],
      coordinates[1],
    );
    const business = await this.businessModel.create({
      ...createBusinessDto,
      location: {
        type: 'Point',
        coordinates: [coordinates[0], coordinates[1]],
      },
      ownerId: owner._id,
      status: BusinessStatus.OPEN,
      geohash_country,
      geohash_region,
      geohash_city,
      geohash_district,
      geohash_neighborhood,
      geohash_street,
      geohash_building,
      geohash: full_geohash,
    });

    return {
      message: STATIC_MESSAGES.success_messages.business_messages.success_register,
      business: BusinessDataDto.fromEntity(business),
    };
  }
  public async getBusinessById(businessId: string, page: number = 1, limit: number = 5, categoryId?: string): Promise<BusinessWithItemsResponseDto> {
    const business = await this.businessModel.findById(businessId).lean();

    if (!business) throw new NotFoundException('Business not found');
    const skip = (page - 1) * limit;
    const filter: FilterQuery<Item> = { businessId };
    if (categoryId) filter.categoryId = categoryId;

    const [items, total] = await Promise.all([this.itemModel.find(filter).skip(skip).limit(limit).lean<Item[]>().exec(), this.itemModel.countDocuments(filter).exec()]);

    return {
      ...BusinessWithItemsResponseDto.fromEntity(business),
      itemsPaginated: PaginatedItemsResponseDto.fromEntity({
        items,
        total,
        page,
        limit,
      }),
    };
  }
  public async updateBusiness(ownerId: string, businessId: string, business: UpdateBusinessDto): Promise<Business> {
    const validatedBusiness = await this.validateBusiness(ownerId, businessId);
    const updatedBusiness = await this.businessModel.findByIdAndUpdate({ _id: validatedBusiness._id }, { $set: business }, { new: true });

    if (!updatedBusiness) {
      throw new NotFoundException('Business not found');
    }
    const itemUpdate: Partial<Item> = {};
    if (business.workingHours !== undefined) {
      itemUpdate.workingHours = business.workingHours;
    }
    if (business.location !== undefined)
      itemUpdate.location = business.location.coordinates ? { type: 'Point', coordinates: [business.location.coordinates[0], business.location.coordinates[1]] } : undefined;

    if (Object.keys(itemUpdate).length > 0) {
      await this.itemModel.updateMany({ businessId: validatedBusiness._id }, { $set: itemUpdate });
    }
    return updatedBusiness;
  }
  public async getNearbyBusiness(lat: number, lng: number, radius?: number, businessType?: BusinessType, page: number = 1, limit: number = 5): Promise<PaginatedBusinessNearMeDto> {
    const filter: any = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius),
        },
      },
    };

    if (businessType) {
      filter.type = businessType;
    }
    const skip = (page - 1) * limit;

    const business = await this.businessModel.find(filter).skip(skip).limit(limit);
    return {
      businesses: business.map((business) => ({
        name: business.name,
        coordinates: business.location?.coordinates || [],
        image: business.images?.[0] || '',
        id: business._id.toString(),
        status: business.status,
        rate: business.rate,
        category: business.category || BusinessCategory.STORE,
        address: business.address || '',
        images: business.images || [],
        tags: business.tags || [],
        type: business.type,
        description: business.description || '',
      })),
      page,
      limit,
    };
  }
  public async getNearbyBusinessMapView(swLng: number, swLat: number, neLng: number, neLat: number, zoom: number, businessType?: BusinessType): Promise<BusinessOnMapDto[]> {
    const filter: any = {
      location: {
        $geoWithin: {
          $box: [
            [swLng, swLat],
            [neLng, neLat],
          ],
        },
      },
    };
    if (businessType) {
      filter.type = businessType;
    }

    const { field } = geohash.getGeohashConfigForZoom(zoom);
    if (field === 'geohash_building' || field === 'geohash_street') {
      const business = await this.businessModel.find(filter);
      return business.map((business) => ({
        name: business.name,
        coordinates: business.location?.coordinates || [],
        id: business._id.toString(),
        status: business.status,
        rate: business.rate,
        type: business.type,
        category: business.category || BusinessCategory.STORE,
        isCluster: false,
      }));
    }

    const ClusteredBusiness = await this.businessModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: `$${field}`,
          sampleBusiness: { $first: '$$ROOT' },
          count: { $sum: 1 },
          centerLng: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } },
          centerLat: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } },
        },
      },
      {
        $project: {
          _id: 0,
          id: '$sampleBusiness._id',
          name: '$sampleBusiness.name',
          coordinates: ['$centerLng', '$centerLat'],
          category: '$sampleBusiness.category',
          status: '$sampleBusiness.status',
          rate: '$sampleBusiness.rate',
          type: '$sampleBusiness.type',
          count: 1,
          isCluster: { $gt: ['$count', 1] },
        },
      },
    ]);
    // if (zoom >= 9) {
    //   const business = await this.businessModel.find(filter);
    //   return business.map((business) => ({
    //     name: business.name,
    //     coordinates: business.location?.coordinates || [],
    //     id: business._id.toString(),
    //     status: business.status,
    //     rate: business.rate,
    //     type: business.type,
    //     category: business.category || BusinessCategory.STORE,
    //   }));
    // }
    // const ClusteredBusiness = await this.businessModel.aggregate([
    //   { $match: filter },

    //   {
    //     $group: {
    //       _id: `$${field}`,
    //       sampleBusiness: { $first: '$$ROOT' },
    //       count: { $sum: 1 },
    //     },
    //   },

    //   {
    //     $project: {
    //       _id: 0,
    //       id: '$sampleBusiness._id',
    //       name: '$sampleBusiness.name',
    //       coordinates: '$sampleBusiness.location.coordinates',
    //       category: '$sampleBusiness.category',
    //       status: '$sampleBusiness.status',
    //       rate: '$sampleBusiness.rate',
    //       type: '$sampleBusiness.type',
    //       count: 1,
    //     },
    //   },
    // ]);

    return ClusteredBusiness;
  }
  public async getBusinessItems(ownerId: string, businessId: string, page: number = 1, limit: number = 10): Promise<PaginatedItemsResponseDto> {
    await this.validateBusiness(ownerId, businessId);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([this.itemModel.find({ businessId }).skip(skip).limit(limit).lean<Item[]>().exec(), this.itemModel.countDocuments({ businessId }).exec()]);

    return {
      items,
      total,
      page,
      limit,
    };
  }
  public async getBusinessByIdOwner(businessId: string, ownerId: string): Promise<BusinessResponseDto> {
    const business = await this.validateBusiness(ownerId, businessId);
    return BusinessResponseDto.fromEntity(business);
  }
  public async rateBusiness(
  businessId: string,
  dto: BusinessRateDto,
  userId: string,
) {
  const business = await this.businessModel.findById(businessId);

  if (!business) {
    throw new NotFoundException('Business not found');
  }

  const existingRating = business.ratings.find(
    (r) => r.userId.toString() === userId,
  );

  if (existingRating) {
    // update
    existingRating.rate = dto.rate;
  } else {
    // add new
    business.ratings.push({
      userId,
      rate: dto.rate,
    });
  }

  const total = business.ratings.reduce((sum, r) => sum + r.rate, 0);

  business.numberOfRatings = business.ratings.length;
  business.rate = total / business.numberOfRatings;

  await business.save();
  return {
  message: 'Business rated successfully',
  rate: business.rate,
  numberOfRatings: business.numberOfRatings,
};
}


 public async unRateBusiness(businessId: string, userId: string) {
  const business = await this.businessModel.findById(businessId);

  if (!business) {
    throw new NotFoundException('Business not found');
  }

  business.ratings = business.ratings.filter(
    (r) => r.userId.toString() !== userId,
  );

  if (business.ratings.length === 0) {
    business.rate = 0;
    business.numberOfRatings = 0;
  } else {
    const total = business.ratings.reduce((sum, r) => sum + r.rate, 0);
    business.numberOfRatings = business.ratings.length;
    business.rate = total / business.numberOfRatings;
  }

  await business.save();

  return { message: 'Business unrated successfully' };
}

  private async validateOwner(ownerId: string) {
    const owner = await this.userModel.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    const existingBusiness = await this.businessModel.findOne({ ownerId: owner._id });
    if (existingBusiness) {
      throw new BadRequestException('Owner already has a business');
    }
    return owner;
  }
  private async validateBusiness(ownerId: string, businessId: string): Promise<Business> {
    const business = await this.businessModel.findOne({
      _id: businessId,
      ownerId,
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}
