/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessService } from './business.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/enums/user-role.enum';
import { BusinessDto } from './dtos/request/business.dto';

@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private buisnessService: BusinessService) {}
  @Roles(Role.OWNER)
  @Post('/register')
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  @ApiBody({ type: BusinessDto })
  public registerBusiness(
    @Body() createBusinessDto: BusinessDto,
    @Req() req: Request,
  ) {
    return this.buisnessService.registerBusiness(
      createBusinessDto,
      req['user'].id,
    );
  }
}
