import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/interfaces/redis.interface';
import { REDIS_SERVICE } from '../redis/redis.module';
import { Inject } from '@nestjs/common';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '5', 10); // 5 seconds
  private readonly MAX_REQUESTS = parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '1',
    10,
  ); // 1 request per window

  constructor(
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisService,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const key = `rate_limit:${userId}`;
    const current = await this.redisService.getJson<{
      count: number;
      resetTime: number;
    }>(key);

    const now = Date.now();
    if (!current || now >= current.resetTime) {
      // Reset the counter
      await this.redisService.setJson(
        key,
        {
          count: 1,
          resetTime: now + this.WINDOW * 1000,
        },
        this.WINDOW,
      );
      return next();
    }

    if (current.count >= this.MAX_REQUESTS) {
      throw new HttpException(
        `Too many requests. Please try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment the counter
    await this.redisService.setJson(
      key,
      {
        count: current.count + 1,
        resetTime: current.resetTime,
      },
      this.WINDOW,
    );

    next();
  }
}
