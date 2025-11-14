import { ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export const mongoConfig = (): MongooseModuleAsyncOptions => ({
  imports: [],
  useFactory: (configService: ConfigService) => {
    const mongoUri = configService.get<string>('MONGODB_URI');

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI is not defined in environment variables. Please check your .env file.',
      );
    }

    return {
      uri: mongoUri,
      connectionFactory: (connection: Connection): Connection => {
        connection.set('strictQuery', false);

        connection.on('connected', () => {
          console.log('[MongoDB] Connected successfully to database');
        });

        connection.on('error', (err: Error) => {
          console.error('[MongoDB] Connection error:', err.message);
        });

        connection.on('disconnected', () => {
          console.warn('[MongoDB] Disconnected from database');
        });

        process.on('SIGINT', () => {
          void connection.close().then(() => {
            console.log(
              '[MongoDB] Connection closed due to application termination',
            );
            process.exit(0);
          });
        });

        return connection;
      },
    };
  },
  inject: [ConfigService],
});
