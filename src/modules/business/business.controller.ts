import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseFloatPipe,
  Patch,
  Post,
  Query,
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
import { User } from 'src/common/decorators/user.decorator';
import { BusinessOnMapDto } from './dtos/response/business-on-map.dto';
import { BusinessCategory } from './enums/business-category.enum';

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
    @User('id') userId: string,
  ) {
    return this.buisnessService.registerBusiness(createBusinessDto, userId);
  }

  @Roles(Role.USER)
  @Get('/nearby')
  @ApiOperation({ summary: 'Get Nearby business' })
  @ApiResponse({ status: 200, description: 'Get Nearby Business successfully' })
  public getNearbyBusiness(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('category', new ParseEnumPipe(BusinessCategory))
    category?: BusinessCategory,
    @Query('radius', new ParseFloatPipe({ optional: true }))
    radius: number = 10000,
  ): Promise<BusinessOnMapDto[]> {
    return this.buisnessService.getNearbyBusiness(lat, lng, radius, category);
  }

  @Roles(Role.USER)
  @Get('/in-area')
  @ApiOperation({ summary: 'Get businesses in an area' })
  @ApiResponse({
    status: 200,
    description: 'Get businesses in an area successfully',
  })
  public getNearbyBusinessMapView(
    @Query('swLng', ParseFloatPipe) swLng: number,
    @Query('swLat', ParseFloatPipe) swLat: number,
    @Query('neLng', ParseFloatPipe) neLng: number,
    @Query('neLat', ParseFloatPipe) neLat: number,
    category?: BusinessCategory,
  ): Promise<BusinessOnMapDto[]> {
    return this.buisnessService.getNearbyBusinessMapView(
      swLng,
      swLat,
      neLng,
      neLat,
      category,
    );
  }

  @Roles(Role.USER, Role.OWNER)
  @Get('/:id')
  @ApiOperation({ summary: 'Get business By ID' })
  @ApiResponse({ status: 200, description: 'Get Business successfully' })
  @ApiBody({ type: BusinessDto })
  public getBusinessById(@Param('id', ParseObjectIdPipe) businessId: string) {
    return this.buisnessService.getBusinessById(businessId);
  }

  @Roles(Role.OWNER)
  @Patch('/:id')
  @ApiOperation({ summary: 'Update business By ID' })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  @ApiBody({ type: UpdateBusinessDto })
  public updateBusiness(
    @Param('id', ParseObjectIdPipe) businessId: string,
    @User('id') userId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.buisnessService.updateBusiness(
      userId,
      businessId,
      updateBusinessDto,
    );
  }
}
