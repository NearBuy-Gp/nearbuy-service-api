import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BusinessService } from './business.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/enums/user-role.enum';
import { BusinessRegistrationDto } from './dtos/request/business-registration.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateBusinessDto } from './dtos/request/business-update-request.dto';
import { User } from 'src/common/decorators/user.decorator';
import { BusinessOnMapDto } from './dtos/response/business-on-map.dto';
import { BusinessCategory } from './enums/business-category.enum';
import { BusinessNearMeDto } from './dtos/response/business-near-me..dto';
import { NearbyQueryDto } from './dtos/request/nearby-query.dto';
import { MapViewQueryDto } from './dtos/request/map-view-query';
import { RegisterBusinessResponseDto } from './dtos/response/register-business-response.dto';

@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Post('/register')
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully',
    type: RegisterBusinessResponseDto,
  })
  @ApiBody({ type: BusinessRegistrationDto })
  public registerBusiness(
    @Body() createBusinessDto: BusinessRegistrationDto,
    @User('id') userId: string,
  ): Promise<RegisterBusinessResponseDto> {
    return this.businessService.registerBusiness(createBusinessDto, userId);
  }

  @Roles(Role.USER)
  @Get('/nearby')
  @ApiOperation({ summary: 'Get Nearby business' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in meters (default is 10000)',
  })
  @ApiQuery({ name: 'category', required: false, enum: BusinessCategory })
  @ApiResponse({
    status: 200,
    description: 'Get Nearby Business successfully',
    type: [BusinessNearMeDto],
  })
  public getNearbyBusiness(
    @Query() query: NearbyQueryDto,
  ): Promise<BusinessNearMeDto[]> {
    return this.businessService.getNearbyBusiness(
      query.lat,
      query.lng,
      query.radius,
      query.category,
    );
  }

  @Roles(Role.USER)
  @Get('/map-view')
  @ApiOperation({ summary: 'Get businesses in map-view' })
  @ApiResponse({
    status: 200,
    description: 'Get businesses map-view successfully',
    type: [BusinessOnMapDto],
  })
  public getNearbyBusinessMapView(
    @Query() query: MapViewQueryDto,
  ): Promise<BusinessOnMapDto[]> {
    return this.businessService.getNearbyBusinessMapView(
      query.swLng,
      query.swLat,
      query.neLng,
      query.neLat,
      query.category,
    );
  }

  @Roles(Role.USER, Role.OWNER)
  @Get('/:id')
  @ApiOperation({ summary: 'Get business By ID' })
  @ApiResponse({
    status: 200,
    description: 'Get Business successfully',
    type: BusinessRegistrationDto,
  })
  public getBusinessById(@Param('id', ParseObjectIdPipe) businessId: string) {
    return this.businessService.getBusinessById(businessId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Patch('/:id')
  @ApiOperation({ summary: 'Update business By ID' })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    type: BusinessRegistrationDto,
  })
  @ApiBody({ type: UpdateBusinessDto })
  public updateBusiness(
    @Param('id', ParseObjectIdPipe) businessId: string,
    @User('id') userId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessService.updateBusiness(
      userId,
      businessId,
      updateBusinessDto,
    );
  }
}
