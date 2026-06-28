import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Business } from '../business/schemas/buisness.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessOnMapDto } from '../business/dtos/response/business-on-map.dto';
import { MessageResponseDto } from '../auth/dtos/message-response.dto';
import { UpdateUserProfileDto } from './dtos/update-Audience.dto';
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


  async addAudienceData(userId: string, dto: UpdateUserProfileDto) {
  return this.userModel.findByIdAndUpdate(
    userId,
    { $set: dto },
    { new: true }
  ).select('age userType interests');
}

public async getProfile(userId: string) {
  const user = await this.userModel
    .findById(userId)
    .populate('bookmarkedBusinesses', 'name category images')

  if (!user) {
    throw new BadRequestException('User not found');
  }

  return {
    id: (user._id as any).toString(),
    userName: user.userName,
    email: user.email,
    //photo: user.photo || null,

    bookmarked: user.bookmarkedBusinesses.map((b: any) => ({
      id: (b._id as any).toString(),
      name: b.name,
      category: b.category,
      images: b.images || [],
    })),
  };
}


public async updateProfile(userId: string, dto: UpdateUserDto) {
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new BadRequestException('User not found');
  }

  if (dto.userName !== undefined) user.userName = dto.userName;
  if (dto.email !== undefined) user.email = dto.email;
  //if (dto.photo !== undefined) user.photo = dto.photo;

  await user.save();

  return {
    message: 'Profile updated successfully',
  };
}



public async deleteProfile(userId: string) {
  const user = await this.userModel.findByIdAndDelete(userId);

  if (!user) {
    throw new BadRequestException('User not found');
  }

  return {
    message: 'User deleted successfully',
  };
}



 public async setFcmToken(userId: string, token: string): Promise<MessageResponseDto> {
    const user = await this.userModel.findByIdAndUpdate(userId, { $set: { fcmToken: token } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      message: 'FCM token registered successfully',
    };
  }

 public async getFcmToken(userId: string): Promise<string | null> {
    const user = await this.userModel.findById(userId).select('fcmToken').lean();
    return user?.fcmToken ?? null;
  }

  public async clearFcmToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: { fcmToken: null } });
  }
}
