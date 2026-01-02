import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
    @Req() req: Request,
    @Body()
    item: CreateItemDto,
  ): Promise<ItemResponseDto> {
    return await this.itemService.addItemManual(
      businessId,
      req['user'].id,
      item,
    );
  }
  @Roles(Role.OWNER)
  @Get('/:itemId')
  @ApiOperation({ summary: 'View Item' })
  @ApiResponse({ status: 200, description: 'Item  Details' })
  public getItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @Req() req: Request,
  ) {
    return this.itemService.getItem(req['user'].id, businessId, itemId);
  }
  @Roles(Role.OWNER)
  @Patch('/:itemId')
  @ApiOperation({ summary: 'Update Item' })
  @ApiResponse({ status: 200, description: 'Item Update Details' })
  @ApiBody({ type: CreateItemDto })
  public updateItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @Body() item: UpdateItemDto,
    @Req() req: Request,
  ) {
    return this.itemService.updateItem(
      req['user'].id,
      businessId,
      itemId,
      item,
    );
  }
  @Roles(Role.OWNER)
  @Delete('/:itemId')
  @ApiOperation({ summary: 'Delete Item' })
  @ApiResponse({ status: 200, description: 'Item Deleted Successfully' })
  public deleteItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @Req() req: Request,
  ) {
    return this.itemService.deleteItem(req['user'].id, businessId, itemId);
  }
  // @Roles(Role.OWNER)
  // @Delete('/bulk')
  // @ApiOperation({ summary: 'Delete Item' })
  // @ApiResponse({ status: 200, description: 'Item Deleted Successfully' })
  // public bulkDeleteItems(
  //   @Param('businessId') businessId: string,
  //   @Param('itemId') itemId: string,
  //   @Body() itemIds: string[],
  //   @Req() req: Request,
  // ) {
  //   return this.itemService.bulkDeleteItem(
  //     req['user'].id,
  //     businessId,
  //     itemId,
  //     itemIds,
  //   );
  // }
}
