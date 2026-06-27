import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateProfileViewDto } from './dto/create-profile-view.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductViewDto } from './dto/create-product-view.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('profile-view')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Record a business profile view by a user' })
  @ApiResponse({ status: 201, description: 'Profile view recorded successfully' })
  createProfileView(@Body() dto: CreateProfileViewDto, @Req() req) {
    return this.analyticsService.createProfileView(dto, req.user.id);
  }

  @Get('business/:id/profile-visits')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get profile visit stats for a business (owner only)' })
  @ApiResponse({ status: 200, description: 'Returns totalVisits, todayVisits, thisWeekVisits' })
  getProfileVisits(@Param('id') businessId: string, @Req() req) {
    return this.analyticsService.getProfileVisits(businessId, req.user.id);
  }

  @Post('product-view')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Record a product view by a user' })
  @ApiResponse({ status: 201, description: 'Product view recorded successfully' })
  createProductView(@Body() dto: CreateProductViewDto, @Req() req) {
    return this.analyticsService.createProductView(dto, req.user.id);
  }

  @Get('business/:id/top-products')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get top viewed products for a business (owner only)' })
  @ApiResponse({ status: 200, description: 'Returns top 10 products sorted by views' })
  getTopProducts(@Param('id') businessId: string, @Req() req) {
    return this.analyticsService.getTopProducts(businessId, req.user.id);
  }

  @Get('business/:id/nearby-competition')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get nearby competitors in the same category (owner only)' })
  @ApiResponse({ status: 200, description: 'Returns competitors within 5km radius' })
  getNearbyCompetition(@Param('id') businessId: string, @Req() req) {
    return this.analyticsService.getNearbyCompetition(businessId, req.user.id);
  }

  @Get('business/:id/audience')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get audience analytics for a business (owner only)' })
  @ApiResponse({ status: 200, description: 'Returns ageGroups, userTypes, and interests breakdown' })
  getAudienceAnalytics(@Param('id') businessId: string, @Req() req) {
    return this.analyticsService.getAudienceAnalytics(businessId, req.user.id);
  }
}