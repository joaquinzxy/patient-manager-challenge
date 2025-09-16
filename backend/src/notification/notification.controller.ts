import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getAllNotifications(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationService.getNotifications(limitNum);
  }

  @Get('by-email')
  @ApiOperation({ summary: 'Get notifications by email' })
  @ApiResponse({ status: 200, description: 'List of notifications for email' })
  async getNotificationsByEmail(
    @Query('email') email: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.notificationService.getNotificationsByEmail(email, limitNum);
  }
}
