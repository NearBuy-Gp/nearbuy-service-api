import { Module } from '@nestjs/common';
import { AutoGenerationService } from './auto-generation-module.service';
import { AutoGenerationController } from './auto-generation-module.controller';

@Module({
  providers: [AutoGenerationService],
  controllers: [AutoGenerationController],
})
export class AutoGenerationModuleModule {}
