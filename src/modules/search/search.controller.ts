import { Body, Controller, Post } from '@nestjs/common';
import { SearchRequestDto } from './dtos/search-request.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post()
  async search(@Body() searchDto: SearchRequestDto) {
    this.searchService.search(searchDto);
  }
}
