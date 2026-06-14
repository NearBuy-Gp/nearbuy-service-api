import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model, PipelineStage } from 'mongoose';
import { Queue } from 'bullmq';
import { NlpClientService } from './clients/nlp-client.service';
import { PipelineBuilderService } from './pipeline/pipeline-builder.service';
import { SearchRequestDto } from './dtos/search-request.dto';
import { AutocompleteRequestDto } from './dtos/autocomplete-request.dto';
import { AutocompleteResponseDto } from './dtos/autocomplete-response.dto';
import { Item } from '../item/schemas/item.schema';
import { InterestService } from '../notification/interest/interest.service';
import {NotificationSubscription,NotificationSubscriptionDocument} from '../notification/schemas/notification-subscriptions.schema';


@Injectable()
export class SearchService {
  constructor(
    @InjectModel('Item') private items: Model<Item>,
    @InjectModel(NotificationSubscription.name)
    private subModel: Model<NotificationSubscriptionDocument>,
    @InjectQueue('notifications') private notifQueue: Queue,
    private readonly nlpClient: NlpClientService,
    private readonly pipelineBuilder: PipelineBuilderService,
    private readonly interestService: InterestService,
  ) {}

  async search(searchRequestDto: SearchRequestDto) {
    const blueprint = await this.nlpClient.parse(searchRequestDto);

    const pipeline: PipelineStage[] = await this.pipelineBuilder.build(blueprint, searchRequestDto);
    const results = await this.items.aggregate(pipeline);
    this.handleSearchSideEffect(searchRequestDto, blueprint).catch(() => {});

    return results;
  }

  // ── Interest recording + BEHAVIORAL subscription upsert ──────────
  private async handleSearchSideEffect(
    dto: SearchRequestDto,
    blueprint: any,
  ): Promise<void> {
    if (blueprint.intent !== 'IN_SCOPE') return;
    if (!dto.userId || !dto.userLocation) return;
    const [lat, lng] = dto.userLocation;

    const now = new Date();

    await this.interestService.record(dto.userId, 'SEARCH', {
      keyword: blueprint.entities?.subject ?? dto.query,
      biz_type: blueprint.entities?.businessType,
      category: blueprint.entities?.businessCategory,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
    });

    const interest = await this.interestService.findOne(
      dto.userId,
      blueprint.entities?.businessType,
    );
    if (!interest || interest.score < 3) return;

    // Upsert the BEHAVIORAL subscription (creates it on first threshold hit,
    // refreshes searchIntent on subsequent searches)
    await this.subModel.findOneAndUpdate(
      {
        userId: dto.userId,
        type: 'BEHAVIORAL',
        'searchIntent.businessType': blueprint.entities?.businessType,
      },
      {
        $set: {
          isActive: true,
          interestRef: interest._id,
          searchIntent: {
            businessType: blueprint.entities?.businessType,
            businessCategory: blueprint.entities?.businessCategory,
            keywords: blueprint.entities?.keywords ?? [],
            original_query: dto.query,
            modifiers: blueprint.entities?.modifiers ?? {},
          },
        },
        $setOnInsert: { notifyCount: 0 },
      },
      { upsert: true, new: true },
    );

    await this.notifQueue.add(
      'REPEATED_SEARCH',
      {
        userId: dto.userId,
        interestId: interest._id.toString(),
      },
      {
        jobId: `repeated-search:${dto.userId}:${blueprint.entities?.businessType}`,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }

  async autocomplete(dto: AutocompleteRequestDto): Promise<AutocompleteResponseDto> {
    const limit = dto.limit ?? 8;
    const safe = this.escapeRegex(dto.q.trim());
    if (!safe) return { suggestions: [] };

    // Match items whose name contains the term at a word boundary, case-insensitive.
    // Grouped by lowercased name to dedupe variants across businesses.
    const regex = new RegExp(`(^|\\s)${safe}`, 'i');

    const rows = await this.items.aggregate<{ name: string; businessName: string }>([
      { $match: { isAvailable: true, name: { $regex: regex } } },
      {
        $group: {
          _id: { $toLower: '$name' },
          name: { $first: '$name' },
          businessName: { $first: '$businessName' },
        },
      },
      { $limit: limit },
      { $project: { _id: 0, name: 1, businessName: 1 } },
    ]);

    return { suggestions: rows };
  }

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
