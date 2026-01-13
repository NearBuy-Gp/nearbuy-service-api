import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseFloatPipe,
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
import { BusinessDto } from './dtos/request/business.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateBusinessDto } from './dtos/request/business-update-request.dto';
import { User } from 'src/common/decorators/user.decorator';
import { BusinessOnMapDto } from './dtos/response/business-on-map.dto';
import { BusinessCategory } from './enums/business-category.enum';
import { Business } from './schemas/buisness.schema';

@UseGuards(AuthGuard, RolesGuard)
@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Roles(Role.OWNER)
  @Post('/register')
  @ApiOperation({ summary: 'Create a new business (Owner)' })
  @ApiResponse({ status: 201, description: 'Business created successfully' })
  @ApiBody({ type: BusinessDto })
  public registerBusiness(
    @Body() createBusinessDto: BusinessDto,
    @User('id') userId: string,
  ) {
    return this.businessService.registerBusiness(createBusinessDto, userId);
  }

  @Roles(Role.USER)
  @Get('/nearby')
  @ApiOperation({ summary: 'Get Nearby business (User)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nearby businesses retrieved successfully',
    type: BusinessOnMapDto,
  })
  public getNearbyBusiness(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('category', new ParseEnumPipe(BusinessCategory, { optional: true }))
    category?: BusinessCategory,
    @Query('radius', new ParseFloatPipe({ optional: true }))
    radius: number = 10000,
  ): Promise<BusinessOnMapDto[]> {
    return this.businessService.getNearbyBusiness(lat, lng, radius, category);
  }

  @Roles(Role.USER)
  @Get('/map-view')
  @ApiOperation({ summary: 'Get businesses in Map view (User)' })
  @ApiQuery({
    name: 'swLng',
    description: 'Southwest longitude of the map viewport',
    required: true,
  })
  @ApiQuery({
    name: 'swLat',
    description: 'Southwest latitude of the map viewport',
    required: true,
  })
  @ApiQuery({
    name: 'neLng',
    description: 'Northeast longitude of the map viewport',
    required: true,
  })
  @ApiQuery({
    name: 'neLat',
    description: 'Northeast latitude of the map viewport',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Map view businesses retrieved successfully',
    type: BusinessOnMapDto,
  })
  public getNearbyBusinessMapView(
    @Query('swLng', ParseFloatPipe) swLng: number,
    @Query('swLat', ParseFloatPipe) swLat: number,
    @Query('neLng', ParseFloatPipe) neLng: number,
    @Query('neLat', ParseFloatPipe) neLat: number,
    @Query('category', new ParseEnumPipe(BusinessCategory, { optional: true }))
    category?: BusinessCategory,
  ): Promise<BusinessOnMapDto[]> {
    return this.businessService.getNearbyBusinessMapView(
      swLng,
      swLat,
      neLng,
      neLat,
      category,
    );
  }

  @Roles(Role.USER, Role.OWNER)
  @Get('/:id')
  @ApiOperation({ summary: 'Get business By ID (User - Owner)' })
  @ApiBody({ type: BusinessDto })
  @ApiResponse({
    status: 200,
    description: 'Get Business successfully',
    type: Business,
  })
  public getBusinessById(
    @Param('id', ParseObjectIdPipe) businessId: string,
  ): Promise<Business> {
    return this.businessService.getBusinessById(businessId);
  }

  @Roles(Role.OWNER)
  @Patch('/:id')
  @ApiOperation({ summary: 'Update business By ID ( Owner)' })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    type: Business,
  })
  @ApiBody({ type: UpdateBusinessDto })
  public updateBusiness(
    @Param('id', ParseObjectIdPipe) businessId: string,
    @User('id') userId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    return this.businessService.updateBusiness(
      userId,
      businessId,
      updateBusinessDto,
    );
  }
}
