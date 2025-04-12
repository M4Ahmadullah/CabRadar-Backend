import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisServiceImpl } from './redis.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SERVICE = 'REDIS_SERVICE';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
          },
        });

        // Test the connection
        try {
          await redis.ping();
          console.log('Redis connection established successfully');
        } catch (error) {
          console.error('Redis connection failed:', error);
          throw error;
        }

        return redis;
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_SERVICE,
      useClass: RedisServiceImpl,
    },
  ],
  exports: [REDIS_SERVICE],
})
export class RedisModule {}
