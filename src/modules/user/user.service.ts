import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Business } from '../business/schemas/buisness.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessOnMapDto } from '../business/dtos/response/business-on-map.dto';
import { MessageResponseDto } from '../auth/dtos/message-response.dto';
import { UpdateUserProfileDto } from './dtos/update-profile.dto';

import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
  ) {}
  public async bookMarkBusiness(userId: string, businessId: string): Promise<MessageResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const business = await this.businessModel.findById(businessId);
    if (!business) {
      throw new BadRequestException('Business not found');
    }

    if (user.bookmarkedBusinesses.includes(businessId as any)) {
      throw new BadRequestException('Business already bookmarked');
    }

    user.bookmarkedBusinesses.push(businessId as any);
    await user.save();
    return {
      message: 'Business bookmarked successfully',
    };
  }
  public async getBookmarkedBusinesses(userId: string): Promise<BusinessOnMapDto[]> {
    const user = await this.userModel.findById(userId).populate('bookmarkedBusinesses');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const bookmarkedBusinessesIds = user.bookmarkedBusinesses;
    const businesses = await this.businessModel.find({ _id: { $in: bookmarkedBusinessesIds } }).exec();

    return businesses.map((business) => BusinessOnMapDto.fromEntity(business));
  } 


  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
  return this.userModel.findByIdAndUpdate(
    userId,
    { $set: dto },
    { new: true }
  ).select('age userType interests');
}
}
