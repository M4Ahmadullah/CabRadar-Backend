import { Injectable, Logger, Inject } from '@nestjs/common';
import { LocationDto } from './dto/location.dto';
import { REDIS_SERVICE } from '../../common/redis/redis.module';
import { RedisService } from '../../common/redis/interfaces/redis.interface';
import { NotificationService } from '../../common/notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCacheService } from '../../common/cache/notification-cache.service';

interface ErrorWithMessage extends Error {
  message: string;
  stack?: string;
}

export interface EventData {
  id: string;
  title: string;
  category: string;
  lat: number;
  lon: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  [key: string]: any;
}

interface RedisEventsResponse {
  success: boolean;
  data: EventData[];
}

interface UserWithFcmToken {
  fcmToken: string | null;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly EVENTS_KEY = 'EventsLive';

  constructor(
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly notificationCacheService: NotificationCacheService,
  ) {}

  async getNearbyEvents(
    location: LocationDto,
    radius: number = 1000,
    userId?: string,
  ): Promise<EventData[]> {
    try {
      this.logger.log(
        `Finding events near coordinates: ${location.latitude}, ${location.longitude} within ${radius}m`,
      );

      // Get all events from Redis
      const eventsData = await this.redisService.getJson<RedisEventsResponse>(
        this.EVENTS_KEY,
      );

      if (!eventsData?.success || !Array.isArray(eventsData.data)) {
        this.logger.warn('No events data found or invalid data format');
        return [];
      }

      // Filter events within radius
      const nearbyEvents = eventsData.data.filter((event: EventData) => {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          event.lat,
          parseFloat(event.lon),
        );
        return distance <= radius;
      });

      this.logger.log(`Found ${nearbyEvents.length} nearby events`);

      // If user ID is provided, send notifications for nearby events
      if (userId && nearbyEvents.length > 0) {
        await this.sendNotificationsForEvents(userId, nearbyEvents);
      }

      return nearbyEvents;
    } catch (error) {
      const typedError = error as ErrorWithMessage;
      this.logger.error(
        `Error finding nearby events: ${typedError.message}`,
        typedError.stack,
      );
      throw new Error(`Failed to find nearby events: ${typedError.message}`);
    }
  }

  private async sendNotificationsForEvents(
    userId: string,
    events: EventData[],
  ) {
    try {
      // Get user's FCM token
      const user = (await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      })) as UserWithFcmToken | null;

      if (!user?.fcmToken || typeof user.fcmToken !== 'string') {
        this.logger.warn(`No valid FCM token found for user ${userId}`);
        return;
      }

      const fcmToken: string = user.fcmToken;

      // Send notification for each event
      for (const event of events) {
        const shouldSend =
          await this.notificationCacheService.shouldSendNotification(
            userId,
            event.id,
          );

        if (!shouldSend) {
          this.logger.debug(
            `Skipping duplicate notification for user ${userId} and event ${event.id}`,
          );
          continue;
        }

        const deepLink = this.generateDeepLink(event);

        await this.notificationService.sendNotification(userId, fcmToken, {
          id: event.id,
          title: event.title || 'Unknown Event',
          category: event.category || 'Unknown Category',
          latitude: event.lat,
          longitude: parseFloat(event.lon),
          description: event.title || 'No description available',
          deepLink,
        });

        this.logger.log(
          `Notification sent to user ${userId} for event ${event.id}`,
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error sending notifications: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private generateDeepLink(event: EventData): string {
    // Generate a deep link that opens the app to the event details
    // You can customize this based on your app's URL scheme
    return `cabradar://event/${event.id}`;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
