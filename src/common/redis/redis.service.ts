import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from './interfaces/redis.interface';

type GeoUnit = 'm' | 'km' | 'mi' | 'ft';
type GeoRadiusResponse = Array<
  | [string, number]
  | [string, [number, number]]
  | [string, string]
  | [string, number, [number, number]]
>;

@Injectable()
export class RedisServiceImpl implements RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async geoAdd(
    key: string,
    member: string,
    longitude: number,
    latitude: number,
  ): Promise<number> {
    return await this.redisClient.geoadd(key, longitude, latitude, member);
  }

  async geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: GeoUnit,
  ): Promise<string[]> {
    const result = await this.redisClient.georadius(
      key,
      longitude,
      latitude,
      radius,
      unit,
    );
    return result as string[];
  }

  async geoRadiusWithDistance(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: GeoUnit,
  ): Promise<Array<[string, number]>> {
    const result = await this.redisClient.georadius(
      key,
      longitude,
      latitude,
      radius,
      unit,
      'WITHDIST',
    );
    return result as Array<[string, number]>;
  }

  async geoDist(
    key: string,
    member1: string,
    member2: string,
  ): Promise<number> {
    try {
      const result = await this.redisClient.geodist(key, member1, member2);
      return result ? parseFloat(result) : 0;
    } catch (error) {
      console.error(`Error getting distance from Redis for key ${key}:`, error);
      return 0;
    }
  }

  async geoSearch(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: GeoUnit,
    options?: {
      withCoord?: boolean;
      withHash?: boolean;
      withDist?: boolean;
      count?: number;
      sort?: 'ASC' | 'DESC';
    },
  ): Promise<
    Array<{
      name: string;
      coordinates?: [number, number];
      hash?: string;
      distance?: number;
    }>
  > {
    const commandArgs: [string, string, string, string, string, ...string[]] = [
      key,
      longitude.toString(),
      latitude.toString(),
      radius.toString(),
      unit,
    ];

    if (options?.withCoord) commandArgs.push('WITHCOORD');
    if (options?.withHash) commandArgs.push('WITHHASH');
    if (options?.withDist) commandArgs.push('WITHDIST');
    if (options?.count) commandArgs.push('COUNT', options.count.toString());
    if (options?.sort) commandArgs.push(options.sort);

    const result = await this.redisClient.georadius(...commandArgs);
    const geoResult = result as GeoRadiusResponse;

    return geoResult.map((item) => {
      const response: {
        name: string;
        coordinates?: [number, number];
        hash?: string;
        distance?: number;
      } = { name: item[0] };

      if (options?.withCoord && Array.isArray(item[1])) {
        response.coordinates = [
          parseFloat(item[1][0].toString()),
          parseFloat(item[1][1].toString()),
        ];
      }
      if (options?.withHash && typeof item[1] === 'string') {
        response.hash = item[1];
      }
      if (options?.withDist && typeof item[1] === 'number') {
        response.distance = item[1];
      }

      return response;
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redisClient.get(key);
      if (!result) return null;
      return JSON.parse(result) as T;
    } catch (error) {
      console.error(`Error getting JSON from Redis for key ${key}:`, error);
      return null;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      } else {
        await this.redisClient.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting JSON in Redis for key ${key}:`, error);
      throw error;
    }
  }
}
