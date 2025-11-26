import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { SignUpRequestDto } from './dtos/signup-request.dto';
import STATIC_MESSAGES from '../../config/staticMessages.json';
import * as bcrypt from 'bcrypt';
import { MessageResponseDto } from './dtos/message-response.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}
  public async signup(
    signUpRequestDto: SignUpRequestDto,
  ): Promise<MessageResponseDto> {
    const { email, password, userName } = signUpRequestDto;
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new BadRequestException(
        STATIC_MESSAGES.error_messages.user_errors.user_exist,
      );
    }
    const userNameExist = await this.userModel.findOne({ userName });
    if (userNameExist) {
      throw new BadRequestException(
        STATIC_MESSAGES.error_messages.user_errors.user_name_exist,
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userModel.create({ userName, password: hashedPassword, email });
    return {
      message: STATIC_MESSAGES.success_messages.user_messages.success_register,
    };
  }
  public async login(
    loginRequestDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    const { email, password } = loginRequestDto;
    const existingUser = await this.userModel.findOne({ email });
    if (!existingUser) {
      throw new NotFoundException(
        STATIC_MESSAGES.error_messages.user_errors.user_not_found,
      );
    }
    const matchedPassword = await bcrypt.compare(
      password,
      existingUser.password,
    );
    if (!matchedPassword) {
      throw new BadRequestException(
        STATIC_MESSAGES.error_messages.user_errors.invalid_email_or_password,
      );
    }
    const userId = existingUser.id;
    const tokenPayload = {
      email: existingUser.email,
      id: userId,
    };
    const accessToken = this.generateAccessToken(tokenPayload);
    const userPayload = {
      id: userId,
      userName: existingUser.userName,
    };
    return {
      userPayload: userPayload,
      accessToken,
    };
  }
  private generateAccessToken(payload: { email: string; id: string }): string {
    return this.jwtService.sign(payload);
  }
}
