import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeStream } from 'mongodb';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BusinessStatus } from '../../../business/enums/business-status.enum';
import { Business } from '../../../business/schemas/buisness.schema';
import { Item } from '../../../item/schemas/item.schema';

@Injectable()
export class EventListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventListenerService.name);

  private restockStream: ChangeStream;
  private openStream: ChangeStream;

  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectQueue('notifications') private notifQueue: Queue,
  ) {}

  onModuleInit() {
    this.startRestockStream();
    this.startOpenStream();
  }

  private startRestockStream() {
    this.restockStream = this.itemModel.watch(
      [
        {
          $match: {
            operationType: 'update',
            'updateDescription.updatedFields.is_in_stock': true,
          },
        },
      ],
      {
        fullDocument: 'updateLookup',
      },
    );

    this.restockStream.on('change', async (change: any) => {
      try {
        const item = change.fullDocument;
        if (!item) return;

        if (!item.is_in_stock || !item.isAvailable) return;

        const itemId = item._id.toString();
        const businessId = item.businessId.toString();

        this.logger.log(`Restock detected: item="${item.name}" business=${businessId}`);

        await this.notifQueue.add(
          'RESTOCK',
          {
            itemId,
            businessId,
            itemName: item.name,
            itemPrice: item.price,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            jobId: `restock-${itemId}-${Date.now()}`,
          },
        );
      } catch (err) {
        this.logger.error('Error handling restock change event', err);
      }
    });

    this.restockStream.on('error', (err) => {
      this.logger.error('Restock stream error — restarting in 5s', err);
      try {
        this.restockStream.close();
      } catch (_) {}
      setTimeout(() => this.startRestockStream(), 5000);
    });

    this.logger.log('Restock Change Stream started');
  }

  private startOpenStream() {
    this.openStream = this.businessModel.watch(
      [
        {
          $match: {
            operationType: 'update',
            $or: [
              { 'updateDescription.updatedFields.is_open_now': true },
              {
                'updateDescription.updatedFields.status': BusinessStatus.OPEN,
              },
            ],
          },
        },
      ],
      {
        fullDocument: 'updateLookup',
      },
    );

    this.openStream.on('change', async (change: any) => {
      try {
        const business = change.fullDocument;
        if (!business) return;

        if (business.status === BusinessStatus.CLOSED || business.status === BusinessStatus.TEMPORARILY_CLOSED) return;

        const businessId = business._id.toString();
        const businessName = business.name;

        this.logger.log(`Store open detected: "${businessName}" (${businessId})`);

        await this.notifQueue.add(
          'BUSINESS_OPEN',
          { businessId, businessName },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            jobId: `open-${businessId}-${Math.floor(Date.now() / 60000)}`,
          },
        );
      } catch (err) {
        this.logger.error('Error handling store-open change event', err);
      }
    });

    this.openStream.on('error', (err) => {
      this.logger.error('Open stream error — restarting in 5s', err);
      try {
        this.openStream.close();
      } catch (_) {}
      setTimeout(() => this.startOpenStream(), 5000);
    });

    this.logger.log('Store-open Change Stream started');
  }

  onModuleDestroy() {
    try {
      this.restockStream?.close();
    } catch (_) {}
    try {
      this.openStream?.close();
    } catch (_) {}
    this.logger.log('Change Streams closed');
  }
}
