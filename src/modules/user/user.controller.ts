import { Controller, Get, Param, Post, UseGuards , Body, Delete, Patch} from '@nestjs/common';
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
}
