import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutoGenerationService } from './auto-generation-module.service';
import { GenerateBusinessAiDto } from './dtos/request/business-ai-generation.dto';

@ApiTags('Auto Generation')
@Controller('auto-generation')
export class AutoGenerationController {
  constructor(private readonly service: AutoGenerationService) {}

  @Post('business')
  @ApiOperation({ summary: 'Generate business-related AI content' })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated AI business content.',
  })
  @ApiBody({ type: GenerateBusinessAiDto })
  public generate(@Body() dto: GenerateBusinessAiDto) {
    return this.service.generateBusinessContent(dto);
  }
}
