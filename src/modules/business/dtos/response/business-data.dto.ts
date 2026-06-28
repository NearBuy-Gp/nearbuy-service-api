import { ApiProperty } from '@nestjs/swagger';
import { BusinessCategory } from '../../enums/business-category.enum';
import { BusinessStatus } from '../../enums/business-status.enum';
import { BusinessType } from '../../enums/business-type.enum';
import { BusinessFacility } from '../../enums/business-facilities.enum';
import { BusinessMainItem } from '../../enums/business-mainitems.enum';
import { Types } from 'mongoose';
import { Business } from '../../schemas/buisness.schema';
import { BusinessTargetAudience } from '../../enums/business-target-audience';
import { computeIsOpenNow } from '../../helpers/working-hours.helper';

export class BusinessDataDto {
  @ApiProperty({ example: 'fsdfgsfdgfsdgdsfg' })
  _id: Types.ObjectId;

  @ApiProperty({ example: 'Coffee Corner' })
  name: string;

  @ApiProperty({ example: 'A cozy place for coffee lovers', required: false })
  description?: string;

  @ApiProperty({ example: ['coffee', 'wifi'], required: false })
  tags?: string[];

  @ApiProperty({ enum: BusinessType, example: BusinessType.CAFE })
  type: BusinessType;

  @ApiProperty({ enum: BusinessCategory, required: false })
  category?: BusinessCategory;

  @ApiProperty({ example: 'Specialty Coffee', required: false })
  subcategory?: string;

  @ApiProperty({ example: '+201234567890', required: false })
  phone?: string;

  @ApiProperty({ example: 'contact@coffeecorner.com', required: false })
  email?: string;

  @ApiProperty({ example: 'https://coffeecorner.com', required: false })
  website?: string;

  @ApiProperty({
    example: {
      facebook: 'https://facebook.com/coffeecorner',
      instagram: 'https://instagram.com/coffeecorner',
    },
    required: false,
  })
  social?: Record<string, string>;

  @ApiProperty({ example: 'Nasr City, Cairo' })
  address: string;

  @ApiProperty({
    example: {
      type: 'Point',
      coordinates: [31.2357, 30.0444], // lng, lat
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @ApiProperty({ example: ['image1.jpg', 'image2.jpg'], required: false })
  images?: string[];

  @ApiProperty({ enum: BusinessStatus, example: BusinessStatus.OPEN })
  status: BusinessStatus;

  @ApiProperty({ example: true, description: 'Manual open/closed switch. Defaults to open (true).' })
  is_open_now: boolean;

  @ApiProperty({
    enum: BusinessTargetAudience,
    example: BusinessTargetAudience.FAMILY,
    isArray: true,
  })
  targetAudience?: BusinessTargetAudience[];

  @ApiProperty({
    enum: BusinessMainItem,
    isArray: true,
    example: [BusinessMainItem.BEVERAGES, BusinessMainItem.SNACKS],
    required: false,
  })
  mainItems?: BusinessMainItem[];

  @ApiProperty({
    enum: BusinessFacility,
    isArray: true,
    example: [BusinessFacility.WIFI_AVAILABLE, BusinessFacility.OUTDOOR_SEATING],
    required: false,
  })
  facilities?: BusinessFacility[];

  @ApiProperty({
    example: ['Other Items'],
    required: false,
  })
  mainItemsOthers?: string[];

  @ApiProperty({
    example: ['Other Audience'],
    required: false,
  })
  targetAudienceOther?: string[];

  @ApiProperty({ example: '64f1a8e7e12a3b0012c3d111' })
  ownerId: Types.ObjectId;

  @ApiProperty({ example: { hasDelivery: true }, required: false })
  attributes?: Record<string, any>;

  public static fromEntity(business: Business): BusinessDataDto {
    const dto = new BusinessDataDto();

    dto._id = business._id;
    dto.name = business.name;
    dto.description = business.description || '';
    dto.tags = business.tags || [];
    dto.type = business.type;
    dto.category = business.category;
    dto.subcategory = business.subcategory;
    dto.phone = business.phone || '';
    dto.email = business.email || '';
    dto.website = business.website || '';
    dto.social = business.social || {};
    dto.address = business.address;
    dto.location = business.location;
    dto.images = business.images || [];
    dto.status = business.status;
    dto.is_open_now = computeIsOpenNow(business.workingHours);
    dto.targetAudience = business.targetAudience;
    dto.mainItems = business.mainItems;
    dto.facilities = business.facilities || [];
    dto.attributes = business.attributes || {};
    dto.mainItemsOthers = business.mainItemsOthers;
    dto.targetAudienceOther = business.targetAudienceOther;
    dto.ownerId = business.ownerId as unknown as Types.ObjectId;

    return dto;
  }
}
