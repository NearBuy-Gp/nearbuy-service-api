import { Module } from '@nestjs/common';
import { AutoGenerationModuleService } from './auto-generation-module.service';
import { AutoGenerationModuleController } from './auto-generation-module.controller';

@Module({
  providers: [AutoGenerationModuleService],
  controllers: [AutoGenerationModuleController],
})
export class AutoGenerationModuleModule {}
