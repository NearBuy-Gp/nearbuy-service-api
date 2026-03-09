import { Injectable } from '@nestjs/common';
import { SearchRequestDto } from '../dtos/search-request.dto';

@Injectable()
export class NlpClientService {
  public async parse(searchRequestDto: SearchRequestDto): Promise<any> {
    // Mocked response for demonstration
    return {};
  }
}
