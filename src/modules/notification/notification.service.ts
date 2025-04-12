import { Injectable } from '@nestjs/common';
import { NotificationService as CommonNotificationService } from '../../common/notification/notification.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly commonNotificationService: CommonNotificationService,
  ) {}

  async sendNotification(
    userId: string,
    deviceToken: string,
    event: {
      id: string;
      title: string;
      category: string;
      latitude: number;
      longitude: number;
      description: string;
      deepLink?: string;
    },
  ): Promise<void> {
    await this.commonNotificationService.sendNotification(
      userId,
      deviceToken,
      event,
    );
  }
}
