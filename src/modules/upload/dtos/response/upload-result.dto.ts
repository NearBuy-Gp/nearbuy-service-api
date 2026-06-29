import { ApiProperty } from '@nestjs/swagger';

export class UploadResultDto {
  @ApiProperty({
    example: 'File Processed Successfully',
  })
  message: string;

  @ApiProperty({
    example: [
      {
        name: 'Chicken Shawarma',
        price: 90,
        type: 'restaurant',
        category: 'Food',
        attributes: {
          menuCategory: 'Shawarma',
          sizes: 'large',
          tags: ['chicken', 'spicy'],
        },
      },
    ],
    description: 'Parsed Items ready to be saved as CreateItemDto',
  })
  paresdItems: any[];

  @ApiProperty({
    example: ["Failed to extract price from 'Beef Burger Deluxe'", "Unknown category 'Deserts' mapped to 'Desserts'"],
    description: 'warnings or partially parsed lines',
    required: false,
  })
  warnings?: string[];
}
