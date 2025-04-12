import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { RedisModule } from '../../common/redis/redis.module';
import { NotificationModule } from '../../common/notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [RedisModule, NotificationModule, PrismaModule, CacheModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
