/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@ApiTags('User')
@Controller('user')
export class UserController {
  @Get('/me')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Success' })
  getUserProfile(@Req() req: Request) {
    return req['user'];
  }
}
