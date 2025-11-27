/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/enums/user-role.enum';

@UseGuards(AuthGuard, RolesGuard)
@ApiTags('User')
@Controller('user')
export class UserController {
  @Roles(Role.OWNER)
  @Get('/me')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Success' })
  getUserProfile(@Req() req: Request) {
    return req['user'];
  }
}
