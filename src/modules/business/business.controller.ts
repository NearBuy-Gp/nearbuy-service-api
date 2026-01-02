/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessService } from './business.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/enums/user-role.enum';
import { BusinessDto } from './dtos/request/business.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateBusinessDto } from './dtos/request/business-update-request.dto';

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
  @Roles(Role.USER, Role.OWNER)
  @Get('/:id')
  @ApiOperation({ summary: 'Get business By ID' })
  @ApiResponse({ status: 200, description: 'Get Business successfully' })
  @ApiBody({ type: BusinessDto })
  public getBusinessById(
    @Req() req: Request,
    @Param('id', ParseObjectIdPipe) businessId: string,
  ) {
    return this.buisnessService.getBusinessById(businessId);
  }
  @Roles(Role.OWNER)
  @Patch('/:id')
  @ApiOperation({ summary: 'Get business By ID' })
  @ApiResponse({ status: 200, description: 'Get Business successfully' })
  @ApiBody({ type: UpdateBusinessDto })
  public updateBusiness(
    @Param('id', ParseObjectIdPipe) businessId: string,
    @Req() req: Request,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.buisnessService.updateBusiness(
      req['user'].id,
      businessId,
      updateBusinessDto,
    );
  }
}
