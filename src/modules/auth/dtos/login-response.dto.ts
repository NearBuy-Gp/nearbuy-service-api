import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../utils/enums/user-role.enum';

export class LoginResponseDto {
  @ApiProperty({
    example: `{ 
  "userName": "john_doe",
  "id": "1234567890",
  "role": "user" 
  }`,
    description: 'User Payload',
  })
  userPayload: {
    userName?: string;
    id: string;
    role: Role;
    businessId?: string;
  };

  @ApiProperty({
    example: 'zgfgdfgfdsgdfhsdfhdfhhtdthgfhdghjh',
    description: 'user token',
    required: false,
  })
  accessToken: string;
}
