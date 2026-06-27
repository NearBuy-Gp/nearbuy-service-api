import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('example')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/api/docs')
  @ApiOperation({ summary: 'Redirect to API documentation' })
  @ApiResponse({ status: 302, description: 'Redirect to Swagger docs' })
  root() {
    return { url: '/api/docs' };
  }

  @Get('api')
  @Redirect('/api/docs')
  @ApiOperation({ summary: 'Redirect to API documentation' })
  @ApiResponse({ status: 302, description: 'Redirect to Swagger docs' })
  apiRoot() {
    return { url: '/api/docs' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
