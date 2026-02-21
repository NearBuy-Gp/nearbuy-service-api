import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { NearbyQueryDto } from './dtos/request/nearby-query.dto';
import { MapViewQueryDto } from './dtos/request/map-view-query';
import { RegisterBusinessResponseDto } from './dtos/response/register-business-response.dto';
import { PaginatedBusinessNearMeDto } from './dtos/response/paginated-business-near-me';
import { PaginatedItemsResponseDto } from '../item/dtos/response/paginated-items-response.dto';
import { BusinessWithItemsResponseDto } from './dtos/response/business-with-items-response.dto';
import { BusinessResponseDto } from './dtos/response/business-response.dto';

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
  public registerBusiness(@Body() createBusinessDto: BusinessRegistrationDto, @User('id') userId: string): Promise<RegisterBusinessResponseDto> {
    return this.businessService.registerBusiness(createBusinessDto, userId);
  }

  @Get('/nearby')
  @ApiOperation({ summary: 'Get Nearby business' })
  @ApiResponse({
    status: 200,
    description: 'Get Nearby Business successfully',
    type: PaginatedBusinessNearMeDto,
  })
  public getNearbyBusiness(@Query() query: NearbyQueryDto): Promise<PaginatedBusinessNearMeDto> {
    return this.businessService.getNearbyBusiness(query.lat, query.lng, query.radius, query.category, query.page, query.limit);
  }

  @Roles(Role.USER)
  @Get('/map-view')
  @ApiOperation({ summary: 'Get businesses in map-view' })
  @ApiResponse({
    status: 200,
    description: 'Get businesses map-view successfully',
    type: [BusinessOnMapDto],
  })
  public getNearbyBusinessMapView(@Query() query: MapViewQueryDto): Promise<BusinessOnMapDto[]> {
    console.log(query);
    return this.businessService.getNearbyBusinessMapView(query.swLng, query.swLat, query.neLng, query.neLat, query.zoom, query.category);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Get('/:id/items')
  @ApiOperation({ summary: 'Get business items By ID' })
  @ApiResponse({
    status: 200,
    description: 'Get Business items successfully',
    type: PaginatedItemsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  public getBusinessItems(
    @Param('id', ParseObjectIdPipe) businessId: string,
    @User('id') userId: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedItemsResponseDto> {
    return this.businessService.getBusinessItems(userId, businessId, page, limit);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get business By ID (User)' })
  @ApiResponse({
    status: 200,
    description: 'Get Business successfully',
    type: BusinessWithItemsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'categoryId', required: false, example: '64c7b2f8c1a2b3c4d5e6f7a8' })
  public getBusinessById(
    @Param('id', ParseObjectIdPipe) businessId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: string,
  ): Promise<BusinessWithItemsResponseDto> {
    return this.businessService.getBusinessById(businessId, page, limit, categoryId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @Get('/:id/owner')
  @ApiOperation({ summary: 'Get business By ID (Owner)' })
  @ApiResponse({
    status: 200,
    description: 'Get Business successfully',
    type: BusinessResponseDto,
  })
  public getBusinessByIdOwner(@Param('id', ParseObjectIdPipe) businessId: string, @User('id') ownerId: string): Promise<BusinessResponseDto> {
    return this.businessService.getBusinessByIdOwner(businessId, ownerId);
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
  public updateBusiness(@Param('id', ParseObjectIdPipe) businessId: string, @User('id') userId: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.updateBusiness(userId, businessId, updateBusinessDto);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(Role.USER)
  // @Patch('/:id/user/rate')
  // @ApiOperation({ summary: 'Rate Business' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Business rated successfully',
  //   type: MessageResponseDto,
  // })
  // @ApiBody({ type: BusinessRateDto })
  // public rateBusiness(@Param('id', ParseObjectIdPipe) businessId: string, @Body() businessRateDto: BusinessRateDto): Promise<MessageResponseDto> {
  //   return this.businessService.rateBusiness(businessId, businessRateDto);
  // }

  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(Role.USER)
  // @Patch('/:id/user/unrate')
  // @ApiOperation({ summary: 'Unrate Business' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Business unrated successfully',
  //   type: MessageResponseDto,
  // })
  // @ApiBody({ schema: { properties: { previousRate: { type: 'number', example: 4 } } } })
  // public unRateBusiness(@Param('id', ParseObjectIdPipe) businessId: string, @Body('previousRate') previousRate: number): Promise<MessageResponseDto> {
  //   return this.businessService.unRateBusiness(businessId, previousRate);
  // }
}
