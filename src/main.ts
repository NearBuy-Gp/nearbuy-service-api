import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import STATIC_MESSAGES from './config/staticMessages.json';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const processLogger = new Logger('Process');

process.on('unhandledRejection', (reason) => {
  processLogger.error('Unhandled promise rejection', reason instanceof Error ? reason.stack : String(reason));
});

process.on('uncaughtException', (error) => {
  processLogger.error('Uncaught exception', error.stack ?? error.message);
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix(STATIC_MESSAGES.document_description.project_global_prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) => Object.values(err.constraints ?? { invalid: `Invalid value for "${err.property}".` }));
        return new BadRequestException(messages);
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigins = process.env.CORS_ORIGIN ? JSON.parse(process.env.CORS_ORIGIN) : ['http://localhost:3000'];

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
  SwaggerModule.setup(STATIC_MESSAGES.swagger_messages.swagger_prefix, app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch((error) => {
  processLogger.error('Failed to bootstrap application', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
