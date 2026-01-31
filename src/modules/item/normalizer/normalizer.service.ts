import { Injectable, Logger } from '@nestjs/common';
import { AiNormalizerStrategy } from './strategies/ai-normalizer.strategy';
import { NormalizeInputDto } from './dtos/normalizer-input.dto';
import { NormalizeOutputDto } from './dtos/normalizer-output.dto';

@Injectable()
export class NormalizerService {
  private readonly logger = new Logger(NormalizerService.name);

  constructor(
    private readonly aiStrategy: AiNormalizerStrategy,
  ) {}

  async normalize(input: NormalizeInputDto): Promise<NormalizeOutputDto[]> {

    this.logger.log('Attempting AI normalization');
    return await this.aiStrategy.normalize(input);
  }
}