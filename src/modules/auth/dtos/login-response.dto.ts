import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/utils/enums/user-role.enum';

export class LoginResponseDto {
  @ApiProperty({
    example: 'name:isel, id:12',
    description: 'User Payload',
  })
  userPayload: {
    userName: string;
    id: string;
    role: Role;
  };

  @ApiProperty({
    example: 'token',
    description: 'user token',
    required: false,
  })
  accessToken: string;
}
