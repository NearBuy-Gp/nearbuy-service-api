import { Module } from '@nestjs/common';
import { NormalizerService } from './normalizer.service';
import { AiNormalizerStrategy } from './strategies/ai-normalizer.strategy';


@Module({
  providers: [
    NormalizerService,
    AiNormalizerStrategy,
    
  ],
  exports: [NormalizerService],
})
export class NormalizerModule {}