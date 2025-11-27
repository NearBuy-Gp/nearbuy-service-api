import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessDto } from './dtos/request/business.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Business } from './schemas/buisness.schema';
import { BusinessStatus } from './enums/business-status.enum';
import { RegisterBusinessResponseDto } from './dtos/response/register-business-response.dto';
import STATIC_MESSAGES from '../../config/staticMessages.json';
@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  public async registerBusiness(
    createBusinessDto: BusinessDto,
    ownerId: string,
  ): Promise<RegisterBusinessResponseDto> {
    const owner = await this.validateOwner(ownerId);
    const business = await this.businessModel.create({
      ...createBusinessDto,
      location: {
        type: 'Point',
        coordinates: createBusinessDto.location.coordinates,
      },
      ownerId: owner._id,
      status: BusinessStatus.OPEN,
    });
    return {
      message:
        STATIC_MESSAGES.success_messages.business_messages.success_register,
      business: business,
    };
  }
  private async validateOwner(ownerId: string) {
    const owner = await this.userModel.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    return owner;
  }
}
