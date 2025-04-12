import { Injectable, Logger } from '@nestjs/common';
import { LocationUpdateDto } from './dto/update-location.dto';
import { REDIS_SERVICE } from '../../common/redis/redis.module';
import { Inject } from '@nestjs/common';
import { RedisService } from '../../common/redis/interfaces/redis.interface';
import { Event } from './interfaces/event.interface';
import { NearbyEvent } from './interfaces/nearby-event.interface';

interface RedisEventsResponse {
  success: boolean;
  data: Event[];
}

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

@Injectable()
export class RadarService {
  private readonly logger = new Logger(RadarService.name);
  private readonly USER_LOCATIONS_KEY = 'user:locations';
  private readonly EVENTS_KEY = 'EventsLive';
  private readonly SEARCH_RADIUS = 1000; // 1km in meters
  private readonly TIME_WINDOW = 10; // ±10 minutes
  private readonly MIN_DISTANCE_CHANGE = 10; // Minimum distance change in meters to trigger update
  private readonly MAX_CACHE_AGE = 300; // 5 minutes in seconds
  private readonly USER_LOCATION_TTL = 900; // 15 minutes in seconds

  // In-memory cache for user locations
  private locationCache: Map<string, CachedLocation> = new Map();

  constructor(
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisService,
  ) {}

  async updateLocation(
    userId: string,
    location: LocationUpdateDto,
  ): Promise<NearbyEvent[]> {
    try {
      this.logger.log(
        `Processing location update for user ${userId} at ${location.latitude}, ${location.longitude}`,
      );

      // Check if we need to update Redis
      const shouldUpdateRedis = await this.shouldUpdateLocation(
        userId,
        location,
      );

      if (shouldUpdateRedis) {
        this.logger.debug(`Updating Redis location for user ${userId}`);
        await this.redisService.geoAdd(
          this.USER_LOCATIONS_KEY,
          userId,
          location.longitude,
          location.latitude,
        );

        // Set TTL for the user's location
        await this.redisService.setJson(
          `${this.USER_LOCATIONS_KEY}:${userId}`,
          { timestamp: Date.now() },
          this.USER_LOCATION_TTL,
        );

        // Update cache
        this.locationCache.set(userId, {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
        });
      }

      // Find nearby events using Redis GEORADIUS
      const nearbyEvents = await this.findNearbyEvents(location);

      this.logger.log(
        `Found ${nearbyEvents.length} nearby events for user ${userId}`,
      );
      if (nearbyEvents.length > 0) {
        nearbyEvents.forEach((event) => {
          this.logger.debug(
            `Event: ${event.title} at distance: ${event.distance}m`,
          );
        });
      }

      return nearbyEvents;
    } catch (error) {
      this.logger.error(`Failed to update location for user ${userId}:`, error);
      throw new Error('Failed to update location');
    }
  }

  private async shouldUpdateLocation(
    userId: string,
    newLocation: LocationUpdateDto,
  ): Promise<boolean> {
    const cachedLocation = this.locationCache.get(userId);
    const now = Date.now();

    // No cached location or cache expired
    if (
      !cachedLocation ||
      now - cachedLocation.timestamp > this.MAX_CACHE_AGE * 1000
    ) {
      return true;
    }

    // Calculate distance change using Redis GEODIST
    const distanceChange = await this.redisService.geoDist(
      this.USER_LOCATIONS_KEY,
      userId,
      `${newLocation.longitude},${newLocation.latitude}`,
    );

    // Only update if significant movement
    return distanceChange >= this.MIN_DISTANCE_CHANGE;
  }

  private async findNearbyEvents(
    location: LocationUpdateDto,
  ): Promise<NearbyEvent[]> {
    try {
      // First, get all events from Redis
      const eventsData = await this.redisService.getJson<RedisEventsResponse>(
        this.EVENTS_KEY,
      );

      if (!eventsData?.success || !Array.isArray(eventsData.data)) {
        this.logger.warn('No events data found or invalid format');
        return [];
      }

      const currentTime = new Date();
      const timeWindowMs = this.TIME_WINDOW * 60 * 1000;

      // Use Redis GEORADIUS to find nearby events
      const nearbyEventIds = await this.redisService.geoRadius(
        this.EVENTS_KEY,
        location.longitude,
        location.latitude,
        this.SEARCH_RADIUS,
        'm',
      );

      // Get events with distances
      const eventsWithDistances = await this.redisService.geoRadiusWithDistance(
        this.EVENTS_KEY,
        location.longitude,
        location.latitude,
        this.SEARCH_RADIUS,
        'm',
      );

      // Process events with proper time filtering
      const nearbyEvents = eventsData.data
        .filter((event) => nearbyEventIds.includes(event.id))
        .map((event) => {
          const distance =
            eventsWithDistances.find((e) => e[0] === event.id)?.[1] || 0;

          return {
            id: event.id,
            title: event.title,
            end_local: event.end_local,
            lat: event.lat,
            lon: event.lon,
            distance,
          };
        })
        .filter((event) => {
          // Filter by time window
          const endTime = new Date(event.end_local);
          const timeDiff = Math.abs(endTime.getTime() - currentTime.getTime());
          const withinTimeWindow = timeDiff <= timeWindowMs;

          if (!withinTimeWindow) {
            this.logger.debug(
              `Event ${event.title} filtered out by time: diff=${timeDiff}ms, window=${timeWindowMs}ms`,
            );
          }

          return withinTimeWindow;
        })
        .sort((a, b) => a.distance - b.distance);

      this.logger.log(
        `Found ${nearbyEvents.length} events within ${this.SEARCH_RADIUS}m and ${this.TIME_WINDOW} minutes`,
      );
      return nearbyEvents;
    } catch (error) {
      this.logger.error('Failed to find nearby events:', error);
      return [];
    }
  }
}
