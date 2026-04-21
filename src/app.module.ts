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
import { CategoriesModule } from './modules/categories/categories.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { NotificationModule } from './modules/notification/notification.module';
import { QueueModule } from './common/queue/queue.module';
import { FirebaseModule } from './modules/firebase/firebase/firebase.module';
import { EventListenerModule } from './modules/notification/event-listener/event-listener/event-listener.module';

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
    UploadModule,
    AutoGenerationModuleModule,
    ItemModule,
    UploadModule,
    NormalizerModule,
    CategoriesModule,
    CloudinaryModule,
    NotificationModule,
    QueueModule,
    FirebaseModule,
    EventListenerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
