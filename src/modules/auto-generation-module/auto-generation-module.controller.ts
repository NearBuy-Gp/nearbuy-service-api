import { Controller, Post, Body } from '@nestjs/common';
import { AutoGenerationService } from './auto-generation-module.service';
import { GenerateBusinessAiDto } from './dtos/request/business-ai-generation.dto';

@Controller('auto-generation')
export class AutoGenerationController {
  constructor(private readonly service: AutoGenerationService) {}

  @Post('business')
  generate(@Body() dto: GenerateBusinessAiDto) {
    return this.service.generateBusinessContent(dto);
  }
}
