import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MessageResponseDto } from './dtos/message-response.dto';
import { SignUpRequestDto } from './dtos/signup-request.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';

@ApiTags('User Authentication')
@Controller('/auth')
export class AuthController {
  constructor(private readonly authServices: AuthService) {}
  @Post('/register')
  @ApiOperation({ summary: 'User Register (User - Owner)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User Register',
    type: MessageResponseDto,
  })
  @ApiBody({ type: SignUpRequestDto })
  public signUp(@Body() signUpRequestDto: SignUpRequestDto): Promise<LoginResponseDto> {
    return this.authServices.signup(signUpRequestDto);
  }
  @Post('/signin')
  @ApiOperation({ summary: 'User Sign In (User - Owner)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User Sign In',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid credentials',
  })
  @ApiBody({ type: LoginRequestDto })
  public signIn(@Body() loginRequestDto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authServices.login(loginRequestDto);
  }
}
