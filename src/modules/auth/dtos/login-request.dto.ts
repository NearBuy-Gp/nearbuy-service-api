import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User Email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'user1234os#',
    description: 'Users Password',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
