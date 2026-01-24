import { ApiProperty } from '@nestjs/swagger';
import { BusinessDataDto } from './business-data.dto';

export class RegisterBusinessResponseDto {
  @ApiProperty({ example: 'Business created successfully' })
  message: string;
  @ApiProperty({ example: 'Business' })
  business: BusinessDataDto;
}
