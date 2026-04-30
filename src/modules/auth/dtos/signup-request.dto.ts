import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../utils/enums/user-role.enum';
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
  @IsOptional()
  @IsString()
  userName?: string;

  @IsEnum(Role)
  @ApiProperty({
    example: 'user',
    description: 'User Role',
    required: false,
  })
  @IsNotEmpty()
  role: Role;
}
