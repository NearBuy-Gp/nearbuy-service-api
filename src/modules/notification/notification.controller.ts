import { Controller, Post, Delete, Get, Body, Param, Query, UseGuards, Request, HttpCode } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('notifications')
// @UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('subscribe')
  subscribe(@Request() req, @Body() dto: SubscribeDto) {
    return this.notificationService.subscribe(req.user.sub, dto);
  }

  @Delete('subscribe')
  @HttpCode(204)
  unsubscribe(@Request() req, @Body() dto: SubscribeDto) {
    return this.notificationService.unsubscribe(req.user.sub, dto);
  }

  @Get('subscriptions/check')
  check(@Request() req, @Query('type') type: string, @Query('businessId') businessId?: string, @Query('itemId') itemId?: string) {
    return this.notificationService.isSubscribed(req.user.sub, { type, businessId, itemId } as any);
  }

  // POST /notifications/:id/snooze
  @Post(':id/snooze')
  snooze(@Request() req, @Param('id') id: string, @Body('hours') hours: number) {
    return this.notificationService.snooze(req.user.sub, id, hours ?? 24);
  }
}
