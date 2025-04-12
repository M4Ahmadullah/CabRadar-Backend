import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '../redis/interfaces/redis.interface';
import { REDIS_SERVICE } from '../redis/redis.module';
import { Logger } from '@nestjs/common';

@Injectable()
export class NotificationCacheService {
  private readonly logger = new Logger(NotificationCacheService.name);
  private readonly TTL = parseInt(
    process.env.NOTIFICATION_CACHE_TTL || '900',
    10,
  ); // 15 minutes

  constructor(
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisService,
  ) {}

  async shouldSendNotification(
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    try {
      const key = `notification:${userId}:${eventId}`;
      const exists = await this.redisService.getJson(key);

      if (exists) {
        this.logger.debug(
          `Notification already sent to user ${userId} for event ${eventId}`,
        );
        return false;
      }

      // Set the cache with TTL
      await this.redisService.setJson(key, { sent: true }, this.TTL);
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking notification cache: ${errorMessage}`);
      // In case of Redis error, allow the notification to be sent
      return true;
    }
  }

  async clearNotificationCache(userId: string, eventId: string): Promise<void> {
    try {
      const key = `notification:${userId}:${eventId}`;
      // Since we don't have a del method in RedisService, we'll set the value to null with a very short TTL
      await this.redisService.setJson(key, null, 1);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error clearing notification cache: ${errorMessage}`);
    }
  }
}
