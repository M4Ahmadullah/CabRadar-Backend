import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '../../common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationModule } from '../location/location.module';
import { RadarModule } from '../radar/radar.module';
import { NotificationModule } from '../notification/notification.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { CacheModule } from '../../common/cache/cache.module';
import { RateLimiterMiddleware } from '../../common/middleware/rate-limiter.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    AuthModule,
    PrismaModule,
    LocationModule,
    RadarModule,
    NotificationModule,
    WebSocketModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes(
        { path: 'location/nearby', method: RequestMethod.POST },
        { path: 'radar/location', method: RequestMethod.POST },
      );
  }
}
