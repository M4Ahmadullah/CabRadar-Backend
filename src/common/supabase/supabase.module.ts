import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

/**
 * SupabaseModule provides the Supabase client for the application.
 * It is a global module that can be imported by any other module.
 *
 * Dependencies:
 * - ConfigModule: For accessing environment variables
 *
 * Exports:
 * - SupabaseService: For use by other modules that need Supabase functionality
 */
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
