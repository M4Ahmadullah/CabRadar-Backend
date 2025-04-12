import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '../redis/interfaces/redis.interface';
import { REDIS_SERVICE } from '../redis/redis.module';
import * as admin from 'firebase-admin';
import { Logger } from '@nestjs/common';
import { FIREBASE_ADMIN } from './constants';

interface Event {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
  deepLink?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly NOTIFIED_EVENTS_TTL = 600; // 10 minutes in seconds

  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App,
    @Inject(REDIS_SERVICE) private readonly redisService: RedisService,
  ) {}

  private getNotifiedKey(userId: string, eventId: string): string {
    return `user:${userId}:notified:${eventId}`;
  }

  async hasBeenNotified(userId: string, eventId: string): Promise<boolean> {
    try {
      const key = this.getNotifiedKey(userId, eventId);
      const result = await this.redisService.getJson(key);
      return result !== null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Error checking notification status: ${error.message}`,
        );
      }
      return false;
    }
  }

  async markAsNotified(userId: string, eventId: string): Promise<void> {
    try {
      const key = this.getNotifiedKey(userId, eventId);
      await this.redisService.setJson(
        key,
        { notified: true },
        this.NOTIFIED_EVENTS_TTL,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error marking notification: ${error.message}`);
      }
      throw error;
    }
  }

  async sendNotification(
    userId: string,
    deviceToken: string,
    event: Event,
  ): Promise<void> {
    try {
      // Check if user has already been notified about this event
      if (await this.hasBeenNotified(userId, event.id)) {
        this.logger.debug(
          `User ${userId} already notified about event ${event.id}`,
        );
        return;
      }

      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title: 'New Event Nearby',
          body: `${event.title} - ${event.category}`,
        },
        data: {
          eventId: event.id,
          title: event.title,
          category: event.category,
          latitude: event.latitude.toString(),
          longitude: event.longitude.toString(),
          description: event.description,
          deepLink: event.deepLink || '',
        },
        android: {
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
            },
          },
        },
      };

      await this.firebaseAdmin.messaging().send(message);
      await this.markAsNotified(userId, event.id);

      this.logger.log(
        `Notification sent successfully to user ${userId} for event ${event.id}`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to send notification: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }
}
