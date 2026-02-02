import { ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Logger } from '@nestjs/common';

const logger = new Logger('MongoConfig');

export const mongoConfig = (): MongooseModuleAsyncOptions => ({
  imports: [],
  useFactory: (configService: ConfigService) => {
    const mongoUri = configService.get<string>('MONGODB_URI');

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please check your .env file.');
    }

    return {
      uri: mongoUri,
      connectionFactory: (connection: Connection): Connection => {
        connection.set('strictQuery', false);

        connection.on('connected', () => {
          logger.log('Connected successfully to database');
        });

        connection.on('error', (err: Error) => {
          logger.error(`Connection error: ${err.message}`);
        });

        connection.on('disconnected', () => {
          logger.warn('Disconnected from database');
        });

        process.on('SIGINT', () => {
          void connection.close().then(() => {
            logger.log('Connection closed due to application termination');
            process.exit(0);
          });
        });

        return connection;
      },
    };
  },
  inject: [ConfigService],
});
