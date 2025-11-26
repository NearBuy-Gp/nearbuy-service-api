/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import STATIC_MESSAGES from 'src/config/staticMessages.json';
import { User } from 'src/modules/user/schemas/user.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        STATIC_MESSAGES.error_messages.auth_errors.unauthorized,
      );
    }

    const token = this.extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedException(
        STATIC_MESSAGES.error_messages.auth_errors.invalid_token_format,
      );
    }

    try {
      const userPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });
      const user = await this.userModel.findOne({ _id: userPayload.id });
      if (!user) {
        throw new UnauthorizedException(
          STATIC_MESSAGES.error_messages.auth_errors.blacklisted_token,
        );
      }

      // if (userPayload.tokenVersion !== user.tokenVersion) {
      //   throw new UnauthorizedException(
      //     STATIC_MESSAGES.error_messages.auth_errors.blacklisted_token,
      //   );
      // }

      req['user'] = userPayload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        STATIC_MESSAGES.error_messages.auth_errors.unauthorized,
      );
    }
  }

  private extractToken(authHeader: string): string | null {
    const bearerPrefix = 'Bearer';
    const [type, token] = authHeader.trim().split(' ');
    return type === bearerPrefix && token ? token : null;
  }
}
