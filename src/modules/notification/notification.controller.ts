import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification to a user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendNotification(
    @Body('userId') userId: string,
    @Body('deviceToken') deviceToken: string,
    @Body('event')
    event: {
      id: string;
      title: string;
      category: string;
      latitude: number;
      longitude: number;
      description: string;
      deepLink?: string;
    },
  ) {
    await this.notificationService.sendNotification(userId, deviceToken, event);
    return { success: true };
  }
}
