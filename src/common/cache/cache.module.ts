import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { NotificationCacheService } from './notification-cache.service';

@Module({
  imports: [RedisModule],
  providers: [NotificationCacheService],
  exports: [NotificationCacheService],
})
export class CacheModule {}
