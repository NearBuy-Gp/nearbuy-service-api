import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business } from '../business/schemas/buisness.schema';
import { EmbedClientService } from './clients/embed-client.service';
import { NlpClientService } from './clients/nlp-client.service';
import { PipelineBuilderService } from './pipeline/pipeline-builder.service';
import { SearchRequestDto } from './dtos/search-request.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel('Business') private businessModel: Model<Business>,
    private readonly nlpClient: NlpClientService,
    private readonly embedClient: EmbedClientService,
    private readonly pipelineBuilder: PipelineBuilderService,
  ) {}

  async search(searchRequestDto: SearchRequestDto) {
    const blueprint = await this.nlpClient.parse(searchRequestDto);

    // if (blueprint.intent === 'OUT_OF_SCOPE') {
    //   throw new BadRequestException('Query is not a supported search type');
    // }

    // const queryVector = await this.embedClient.embed(blueprint.search_vector_query);

    // const pipeline = this.pipelineBuilder.build(blueprint, queryVector);
    // const results = await this.businessModel.aggregate(pipeline);

    // return results;
  }
}
