import { GatewayTimeoutException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { SemanticSearchItemRequestDto } from '../interfaces/semantic-search-request.interface';
import { CreateEmbeddingResponse } from '../interfaces/create-embedding.response.interface';
import * as https from 'https';
import { AxiosError } from 'axios';

@Injectable()
export class EmbedClientService {
  private readonly embedUrl: string;
  private useFallback: boolean = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.embedUrl = this.configService.get<string>('NLP_SERVICE_URL') || 'http://localhost:5000';
  }
  public async createEmbedding(semanticSearchItemRequestDto: SemanticSearchItemRequestDto): Promise<number[]> {
    const payload = {
      ...semanticSearchItemRequestDto,
    };

    const agent = new https.Agent({
      keepAlive: true,
      timeout: 30000,
    });

    const response = await firstValueFrom(
      this.httpService
        .post<CreateEmbeddingResponse>(`${this.embedUrl}/index`, payload, {
          timeout: 30000,
          httpsAgent: agent,
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.error('NLP error response:', {
              status: error.response?.status,
              data: error.response?.data,
              payload,
            });

            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
              throw new GatewayTimeoutException('NLP service timed out');
            }

            throw new InternalServerErrorException(error.message);
          }),
        ),
    );

    const vector = response.data.embedding_vector;

    if (response.data.dimensions !== 384) {
      throw new InternalServerErrorException(`Embedding returned ${vector.length} dimensions, expected 384`);
    }

    return vector;
  }
}
