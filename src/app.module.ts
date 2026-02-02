import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { mongoConfig } from './config/mongo.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BusinessModule } from './modules/business/business.module';
import { AutoGenerationModuleModule } from './modules/auto-generation-module/auto-generation-module.module';
import { ItemModule } from './modules/item/item.module';
import { UploadModule } from './modules/upload/upload.module';
import { NormalizerModule } from './modules/upload/normalizer/normalizer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    MongooseModule.forRootAsync(mongoConfig()),
    AuthModule,
    UserModule,
    BusinessModule,
    AutoGenerationModuleModule,
    ItemModule,
    UploadModule,
    NormalizerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
