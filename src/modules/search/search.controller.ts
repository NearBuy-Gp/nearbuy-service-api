import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchRequestDto } from './dtos/search-request.dto';
import { AutocompleteRequestDto } from './dtos/autocomplete-request.dto';
import { AutocompleteResponseDto } from './dtos/autocomplete-response.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post()
  @ApiOperation({
    summary: 'Semantic search for items',
    description: 'Runs the NLP blueprint pipeline (vector + geo + price/rating + ranking) and returns ranked items. Optional `priceMin`, `priceMax`, and `ratingMin` (1-5) override any filters extracted from the natural-language query.',
  })
  @ApiBody({ type: SearchRequestDto })
  @ApiResponse({ status: 200, description: 'Ranked list of items matching the query and filters.' })
  @ApiResponse({ status: 400, description: 'Validation error on request body.' })
  public async search(@Body() searchDto: SearchRequestDto) {
    return await this.searchService.search(searchDto);
  }

  @Get('/autocomplete')
  @ApiOperation({
    summary: 'Autocomplete item names',
    description: 'Returns up to `limit` available item-name suggestions matching the partial term `q`. Match is case-insensitive and anchored at word boundaries.',
  })
  @ApiResponse({ status: 200, description: 'List of suggestions.', type: AutocompleteResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error on query parameters.' })
  public async autocomplete(@Query() query: AutocompleteRequestDto): Promise<AutocompleteResponseDto> {
    return await this.searchService.autocomplete(query);
  }
}
