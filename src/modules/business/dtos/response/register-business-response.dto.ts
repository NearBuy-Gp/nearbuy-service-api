import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../../schemas/buisness.schema';

export class RegisterBusinessResponseDto {
  @ApiProperty({ example: 'Business created successfully' })
  message: string;
  @ApiProperty({ example: 'Business' })
  business: Business;
}
