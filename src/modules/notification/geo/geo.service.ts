import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Assumes Business model is registered in your BusinessModule
// and re-exported or imported here via MongooseModule
@Injectable()
export class GeoService {
  constructor(
    @InjectModel('Business')
    private readonly businessModel: Model<any>,
  ) {}

  async findNearUser(
    lat: number,
    lng: number,
    options: {
      biz_type: string;
      category: string;
      maxDistanceMeters?: number;
      minRating?: number;
    },
  ): Promise<any[]> {
    return this.businessModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: options.maxDistanceMeters ?? 500,
          query: {
            category: options.category,
            business_type: options.biz_type,
            is_open_now: true,
          },
          spherical: true,
        },
      },
      { $match: { 'rating.average': { $gte: options.minRating ?? 3.5 } } },
      { $limit: 3 },
    ]);
  }
}