import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmbedClientService {
  private readonly embedUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.embedUrl = this.configService.get<string>('NLP_SERVICE_URL') || 'http://localhost:5000';
  }

  public async createEmbedding(text: string): Promise<number[]> {
    const response = await firstValueFrom(this.httpService.post<{ vector: number[] }>(`${this.embedUrl}/embed`, { text }, { timeout: 5000 }));

    const vector = response.data.vector;

    if (vector.length !== 384) {
      throw new InternalServerErrorException(`Embedding returned ${vector.length} dimensions, expected 384`);
    }

    return vector;
  }
}
