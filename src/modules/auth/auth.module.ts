import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';

/**
 * AuthModule is responsible for user authentication and authorization.
 * It integrates with Supabase for authentication and Prisma for user data storage.
 *
 * Dependencies:
 * - SupabaseModule: Provides Supabase client for authentication
 * - PrismaModule: Provides database access for user data
 *
 * Exports:
 * - AuthService: For use by other modules that need authentication
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    SupabaseModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('SUPABASE_JWT_SECRET');
        if (!secret) {
          throw new Error('JWT secret is not configured');
        }
        return {
          secret,
          signOptions: { expiresIn: '1d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
