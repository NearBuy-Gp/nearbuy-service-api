import { ApiProperty } from '@nestjs/swagger';
import { BusinessDataDto } from './business-data.dto';

export class BusinessInformationResponseDto {
  @ApiProperty({ example: 'Business created successfully' })
  message: string;
  @ApiProperty({
    example: {
      _id: '64b7f8f2c9e77a6f4d2e8b9a',
      name: 'Coffee Corner',
      description: 'A cozy place for coffee lovers',
      tags: ['coffee', 'wifi'],
      type: 'CAFE',
      category: 'RESTAURANT',
      subcategory: 'Specialty Coffee',
      phone: '+201234567890',
      email: '',
      website: 'https://coffeecorner.com',
      social: {
        facebook: 'https://facebook.com/coffeecorner',
      },
    },
  })
  business: BusinessDataDto;
}
