import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import STATIC_MESSAGES from 'src/config/staticMessages.json';
import { User } from 'src/modules/user/schemas/user.schema';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(STATIC_MESSAGES.error_messages.auth_errors.unauthorized);
    }

    const token = this.extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedException(STATIC_MESSAGES.error_messages.auth_errors.invalid_token_format);
    }

    try {
      const userPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });
      const user = await this.userModel.findOne({ _id: userPayload.id });
      if (!user) {
        throw new UnauthorizedException(STATIC_MESSAGES.error_messages.auth_errors.blacklisted_token);
      }

      // Type-safe assignment using RequestWithUser interface
      req.user = {
        id: userPayload.id,
        email: userPayload.email,
        role: user.role,
        businessId: userPayload.businessId,
      };
      return true;
    } catch (_error) {
      this.logger.warn('Authentication failed');
      throw new UnauthorizedException(STATIC_MESSAGES.error_messages.auth_errors.unauthorized);
    }
  }

  private extractToken(authHeader: string): string | null {
    const bearerPrefix = 'Bearer';
    const [type, token] = authHeader.trim().split(' ');
    return type === bearerPrefix && token ? token : null;
  }
}
