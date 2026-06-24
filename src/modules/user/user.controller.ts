import { Controller, Get, Param, Post, UseGuards ,Patch,Body} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';

import { User } from '../../common/decorators/user.decorator';
import { UserService } from './user.service';
import { BusinessOnMapDto } from '../business/dtos/response/business-on-map.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserProfileDto } from './dtos/user-profile.dto';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../utils/enums/user-role.enum';
import { UpdateUserProfileDto } from './dtos/update-profile.dto';


@UseGuards(AuthGuard, RolesGuard)
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Book mark a business' })
  @ApiResponse({ status: 200, description: 'Business bookmarked successfully' })
  @Post('/book-mark/business/:businessId')
  public async saveBusiness(@Param('businessId') businessId: string, @User('id') userId: string) {
    return this.userService.bookMarkBusiness(userId, businessId);
  }
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get bookmarked businesses' })
  @ApiResponse({ status: 200, description: 'List of bookmarked businesses', type: BusinessOnMapDto, isArray: true })
  @Get('/book-mark/business')
  public async getBookmarkedBusinesses(@User('id') userId: string): Promise<BusinessOnMapDto[]> {
    return this.userService.getBookmarkedBusinesses(userId);
  }

  @Roles(Role.USER)
@ApiOperation({ summary: 'Update audience profile for better targeting' })
@ApiResponse({ status: 200, description: 'Audience profile updated successfully' })
@Patch('/audience-profile')
public async updateAudienceProfile(
  @Body() dto: UpdateUserProfileDto,
  @User('id') userId: string,
) {
  return this.userService.updateProfile(userId, dto);
}

}
