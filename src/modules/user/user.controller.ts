import { Controller, Get, Param, Post, UseGuards ,Patch,Body,Delete} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags , ApiBody  } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';

import { User } from '../../common/decorators/user.decorator';
import { UserService } from './user.service';
import { BusinessOnMapDto } from '../business/dtos/response/business-on-map.dto';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../utils/enums/user-role.enum';
import { UpdateUserProfileDto } from './dtos/update-Audience.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserProfileDto } from './dtos/user-profile.dto';
import { SetFcmTokenDto } from './dtos/set-fcm-token.dto';

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
  return this.userService.addAudienceData(userId, dto);
}



 @Roles(Role.USER)
@Get('/profile')
@ApiOperation({ summary: 'Get user profile' })

@ApiResponse({
  status: 200,
  description: 'User profile retrieved successfully',
  type: UserProfileDto,
})

@ApiResponse({ status: 401, description: 'Unauthorized' })
public async getProfile(
  @User('id') userId: string,
): Promise<UserProfileDto> {
  return this.userService.getProfile(userId);
}


@Roles(Role.USER)
@Patch('/profile')

@ApiOperation({ summary: 'Update user profile' })

@ApiBody({ type: UpdateUserDto })

@ApiResponse({
  status: 200,
  description: 'User profile updated successfully',
  type: UserProfileDto,
})

@ApiResponse({ status: 401, description: 'Unauthorized' })
@Patch('/profile')
public async updateProfile(
  @User('id') userId: string,
  @Body() dto: UpdateUserDto,
) {
  return this.userService.updateProfile(userId, dto);
}



@Roles(Role.USER)
@Delete('/profile')

@ApiOperation({ summary: 'Delete user profile' })

@ApiResponse({
  status: 200,
  description: 'User deleted successfully',
  schema: {
    example: {
      message: 'User deleted successfully',
    },
  },
})

@ApiResponse({ status: 401, description: 'Unauthorized' })

public async deleteProfile(
  @User('id') userId: string,
) {
  return this.userService.deleteProfile(userId);
}


@Roles(Role.USER)
@Post('/fcm-token')
@ApiOperation({ summary: 'Register or update the user\'s FCM device token' })
@ApiBody({ type: SetFcmTokenDto })
@ApiResponse({ status: 201, description: 'FCM token registered successfully' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
public async setFcmToken(
  @User('id') userId: string,
  @Body() dto: SetFcmTokenDto,
) {
  return this.userService.setFcmToken(userId, dto.token);
}


@Roles(Role.USER)
@Delete('/fcm-token')
@ApiOperation({ summary: 'Clear the user\'s FCM device token (e.g. on logout)' })
@ApiResponse({ status: 200, description: 'FCM token cleared successfully' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
public async clearFcmToken(
  @User('id') userId: string,
) {
  await this.userService.clearFcmToken(userId);
  return { message: 'FCM token cleared successfully' };
}

}
