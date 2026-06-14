import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Business, BusinessSchema } from '../business/schemas/buisness.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Item, ItemSchema } from '../item/schemas/item.schema';
import { NlpClientService } from './clients/nlp-client.service';
import { PipelineBuilderService } from './pipeline/pipeline-builder.service';
import { EmbedClientService } from './clients/embed-client.service';
import { AttributeStageBuilder } from './pipeline/attribute-stage.builder';
import { GeoStageBuilder } from './pipeline/geo-stage.builder';
import { PIPELINE_STAGE_BUILDERS, IPipelineStageBuilder } from './pipeline/pipeline-stage-builder.interface';
import { PriceRatingStageBuilder } from './pipeline/price-rating-stage.builder';
import { ProjectionStageBuilder } from './pipeline/projection-stage.builder';
import { TimeStageBuilder } from './pipeline/time-stage.builder';
import { SortStageBuilder } from './pipeline/sort-stage.builder';
import { ScoreStageBuilder } from './pipeline/score-stage.builder';
import { HttpModule } from '@nestjs/axios';
import {NotificationSubscription,NotificationSubscriptionSchema} from '../notification/schemas/notification-subscriptions.schema';
import { InterestModule } from '../notification/interest/interest.module';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: User.name, schema: UserSchema },
      { name: Item.name, schema: ItemSchema },
      { name: NotificationSubscription.name, schema: NotificationSubscriptionSchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
    InterestModule,
  ],
  providers: [
    SearchService,
    NlpClientService,
    EmbedClientService,
    PipelineBuilderService,
    GeoStageBuilder,
    TimeStageBuilder,
    PriceRatingStageBuilder,
    AttributeStageBuilder,
    ProjectionStageBuilder,
    SortStageBuilder,
    ScoreStageBuilder,
    {
      provide: PIPELINE_STAGE_BUILDERS,
      useFactory: (...builders: IPipelineStageBuilder[]) => builders,
      inject: [GeoStageBuilder, TimeStageBuilder, PriceRatingStageBuilder, AttributeStageBuilder, ProjectionStageBuilder],
    },
  ],
  controllers: [SearchController],
})
export class SearchModule {}
