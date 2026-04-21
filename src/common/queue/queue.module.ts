import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
