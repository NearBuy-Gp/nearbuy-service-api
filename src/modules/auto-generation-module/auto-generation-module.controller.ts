import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AutoGenerationService } from './auto-generation-module.service';
import { GenerateBusinessAiDto } from './dtos/request/business-ai-generation.dto';

 
@Controller('auto-generation')
export class AutoGenerationController {
  constructor(private readonly service: AutoGenerationService) {}
  
  @Post('business')
  @ApiTags('Auto Generation')
  @ApiOperation({ summary: 'Generate business-related AI content' })  
  @ApiResponse({
    status: 200,
    description: 'Successfully generated AI business content.',
  }) 
  generate(@Body() dto: GenerateBusinessAiDto) {
    return this.service.generateBusinessContent(dto);
  }
}
