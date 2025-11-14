import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
@ApiTags('example')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get example data' })
  @ApiResponse({ status: 200, description: 'Success' })
  getHello(): string {
    return this.appService.getHello();
  }
}
