import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema } from '../business/schemas/buisness.schema';
@Module({
  providers: [UserService],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        return {
          secret: configService.get<string>('JWT_SECRET_KEY') || '',
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
  ],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
