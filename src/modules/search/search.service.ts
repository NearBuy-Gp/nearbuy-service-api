import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { NlpClientService } from './clients/nlp-client.service';
import { PipelineBuilderService } from './pipeline/pipeline-builder.service';
import { SearchRequestDto } from './dtos/search-request.dto';
import { AutocompleteRequestDto } from './dtos/autocomplete-request.dto';
import { AutocompleteResponseDto } from './dtos/autocomplete-response.dto';
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
