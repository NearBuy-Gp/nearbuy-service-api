import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRegistrationDto } from './dtos/request/business-registration.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Business } from './schemas/buisness.schema';
import { BusinessStatus } from './enums/business-status.enum';
import { RegisterBusinessResponseDto } from './dtos/response/register-business-response.dto';
import STATIC_MESSAGES from '../../config/staticMessages.json';
import { UpdateBusinessDto } from './dtos/request/business-update-request.dto';
import { BusinessOnMapDto } from './dtos/response/business-on-map.dto';
import { BusinessCategory } from './enums/business-category.enum';
import { BusinessDataDto } from './dtos/response/business-data.dto';
import { BusinessNearMeDto } from './dtos/response/business-near-me..dto';
@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  public async registerBusiness(
    createBusinessDto: BusinessRegistrationDto,
    ownerId: string,
  ): Promise<RegisterBusinessResponseDto> {
    const owner = await this.validateOwner(ownerId);
    const coordinates = createBusinessDto.location.coordinates.map(Number);
    if (coordinates.length !== 2) {
      throw new Error(
        'Location coordinates must be an array of 2 numbers [longitude, latitude]',
      );
    }
    const business = await this.businessModel.create({
      ...createBusinessDto,
      location: {
        type: 'Point',
        coordinates: [coordinates[0], coordinates[1]],
      },
      ownerId: owner._id,
      status: BusinessStatus.OPEN,
    });

    return {
      message:
        STATIC_MESSAGES.success_messages.business_messages.success_register,
      business: BusinessDataDto.fromEntity(business),
    };
  }
  public async getBusinessById(businessId: string): Promise<Business> {
    const business = await this.businessModel.findOne({ _id: businessId });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
  public async updateBusiness(
    ownerId: string,
    businessId: string,
    business: UpdateBusinessDto,
  ): Promise<Business> {
    const validatedBusiness = await this.validateBusiness(ownerId, businessId);
    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      { _id: validatedBusiness._id },
      { $set: business },
      { new: true },
    );

    if (!updatedBusiness) {
      throw new NotFoundException('Business not found');
    }

    return updatedBusiness;
  }
  public async getNearbyBusiness(
    lat: number,
    lng: number,
    radius?: number,
    category?: BusinessCategory,
  ): Promise<BusinessNearMeDto[]> {
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

    if (category) {
      filter.category = category;
    }

    const business = await this.businessModel.find(filter);
    return business.map((business) => ({
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
    }));
  }
  public async getNearbyBusinessMapView(
    swLng: number,
    swLat: number,
    neLng: number,
    neLat: number,
    category?: BusinessCategory,
  ): Promise<BusinessOnMapDto[]> {
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
    if (category) {
      filter.category = category;
    }
    const business = await this.businessModel.find(filter);
    return business.map((business) => ({
      name: business.name,
      coordinates: business.location?.coordinates || [],
      id: business._id.toString(),
      status: business.status,
      rate: business.rate,
      category: business.category || BusinessCategory.STORE,
    }));
  }
  private async validateOwner(ownerId: string) {
    const owner = await this.userModel.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    return owner;
  }
  private async validateBusiness(
    ownerId: string,
    businessId: string,
  ): Promise<Business> {
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
