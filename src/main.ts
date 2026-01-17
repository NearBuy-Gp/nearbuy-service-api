import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import STATIC_MESSAGES from './config/staticMessages.json';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix(
    STATIC_MESSAGES.document_description.project_global_prefix,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim().replace(/^["']|["']$/g, ''))
        .filter((origin) => origin.length > 0)
    : 'localhost:3000';

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle(STATIC_MESSAGES.document_description.project_title)
    .setDescription(STATIC_MESSAGES.document_description.project_description)
    .setVersion(STATIC_MESSAGES.document_description.project_version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(
    STATIC_MESSAGES.swagger_messages.swagger_prefix,
    app,
    document,
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
