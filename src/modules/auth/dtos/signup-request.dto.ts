/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class SignUpRequestDto {
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

  @ApiProperty({
    example: 'use1',
    description: 'User Name',
  })
  @IsNotEmpty()
  @IsString()
  userName: string;
}
