import { Injectable } from '@nestjs/common';
import { SearchRequestDto } from '../dtos/search-request.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NlpBluePrint } from '../interfaces/nlp-blue-print.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NlpClientService {
  private readonly embedUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.embedUrl = this.configService.get<string>('NLP_SERVICE_URL') || 'http://localhost:5000';
  }
  public async parse(searchRequestDto: SearchRequestDto): Promise<NlpBluePrint> {
    const response = await firstValueFrom(
      this.httpService.post<NlpBluePrint>(`${this.embedUrl}/parse`, {
        text: searchRequestDto.query,
      }),
    );

    return response.data;
  }
}
