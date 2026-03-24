import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Business } from '../business/schemas/buisness.schema';
import { EmbedClientService } from './clients/embed-client.service';
import { NlpClientService } from './clients/nlp-client.service';
import { PipelineBuilderService } from './pipeline/pipeline-builder.service';
import { SearchRequestDto } from './dtos/search-request.dto';
import { Item } from '../item/schemas/item.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel('Item') private items: Model<Item>,
    private readonly nlpClient: NlpClientService,
    private readonly pipelineBuilder: PipelineBuilderService,
  ) {}

  async search(searchRequestDto: SearchRequestDto) {
    const blueprint = await this.nlpClient.parse(searchRequestDto);

    const pipeline: PipelineStage[] = await this.pipelineBuilder.build(blueprint, searchRequestDto);
    const results = await this.items.aggregate(pipeline);

    return results;
  }
}
