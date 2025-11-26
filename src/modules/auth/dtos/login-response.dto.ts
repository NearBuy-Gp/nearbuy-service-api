import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'name:isel, id:12',
    description: 'User Payload',
  })
  userPayload: {
    userName: string;
    id: string;
  };

  @ApiProperty({
    example: 'token',
    description: 'user token',
    required: false,
  })
  accessToken: string;
}
