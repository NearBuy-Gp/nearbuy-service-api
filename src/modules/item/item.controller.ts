import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/utils/enums/user-role.enum';
import { CreateItemDto } from './dtos/requests/create-item.dto';
import { ItemResponseDto } from './dtos/response/item.response.dto';
import { UpdateItemDto } from './dtos/requests/update-item.dto';
import { User } from 'src/common/decorators/user.decorator';

@ApiTags('Item')
@UseGuards(AuthGuard, RolesGuard)
@Controller(':businessId/item')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Roles(Role.OWNER)
  @Post('/add-manual')
  @ApiOperation({ summary: 'Add Item' })
  @ApiResponse({ status: 200, description: 'Item Added Successfully' })
  @ApiBody({ type: CreateItemDto })
  public async addItemManual(
    @Param('businessId') businessId: string,
    @User('id') userId: string,
    @Body() item: CreateItemDto,
  ): Promise<ItemResponseDto> {
    return await this.itemService.addItemManual(businessId, userId, item);
  }

  @Roles(Role.OWNER)
  @Get('/:itemId')
  @ApiOperation({ summary: 'View Item' })
  @ApiResponse({ status: 200, description: 'Item Details' })
  public getItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @User('id') userId: string,
  ) {
    return this.itemService.getItem(userId, businessId, itemId);
  }

  @Roles(Role.OWNER)
  @Patch('/:itemId')
  @ApiOperation({ summary: 'Update Item' })
  @ApiResponse({ status: 200, description: 'Item Update Details' })
  @ApiBody({ type: UpdateItemDto })
  public updateItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @User('id') userId: string,
    @Body() item: UpdateItemDto,
  ) {
    return this.itemService.updateItem(userId, businessId, itemId, item);
  }

  @Roles(Role.OWNER)
  @Delete('/:itemId')
  @ApiOperation({ summary: 'Delete Item' })
  @ApiResponse({ status: 200, description: 'Item Deleted Successfully' })
  public deleteItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @User('id') userId: string,
  ) {
    return this.itemService.deleteItem(userId, businessId, itemId);
  }
}
