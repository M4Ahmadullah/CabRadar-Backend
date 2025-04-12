import { Injectable, Logger } from '@nestjs/common';
import {
  SupabaseClient,
  createClient,
  User,
  Session,
} from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthResult } from '../../modules/auth/interfaces/auth.interface';

/**
 * SupabaseService is a wrapper around the Supabase client that provides
 * authentication and database operations. It handles user signup, signin,
 * and session management.
 *
 * This service is used by the AuthModule to handle user authentication
 * and by other modules that need to interact with Supabase's features.
 */
@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    // Initialize Supabase client with project URL and anon key
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    this.logger.log(`Initializing Supabase with URL: ${supabaseUrl}`);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  private convertSupabaseSession(session: Session | null): Session | null {
    if (!session) return null;
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    };
  }

  /**
   * Signs up a new user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise containing user data and session information
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    this.logger.log(`Attempting to sign up user: ${email}`);
    try {
      const response = await this.client.auth.signUp({
        email,
        password,
      });

      if (response.error) {
        this.logger.error(`Supabase signup error: ${response.error.message}`);
        throw response.error;
      }

      if (!response.data?.user) {
        this.logger.error('Failed to create user: No user data returned');
        throw new Error('Failed to create user');
      }

      const userData = response.data.user;
      this.logger.log(`Successfully created user with ID: ${userData.id}`);

      return {
        user: {
          id: userData.id,
          email: userData.email || email,
          name: userData.user_metadata?.name || '',
        },
        session: this.convertSupabaseSession(response.data.session),
      };
    } catch (error) {
      this.logger.error('Error during signup:');
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Signs in an existing user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise containing user data and session information
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    this.logger.log(`Attempting to sign in user: ${email}`);
    try {
      const response = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        this.logger.error(`Supabase signin error: ${response.error.message}`);
        throw response.error;
      }

      if (!response.data?.user) {
        this.logger.error('User not found during signin');
        throw new Error('User not found');
      }

      const userData = response.data.user;
      this.logger.log(`Successfully signed in user with ID: ${userData.id}`);

      return {
        user: {
          id: userData.id,
          email: userData.email || email,
          name: userData.user_metadata?.name || '',
        },
        session: this.convertSupabaseSession(response.data.session),
      };
    } catch (error) {
      this.logger.error('Error during signin:');
      this.logger.error(error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        this.logger.error(`Supabase signout error: ${error.message}`);
        throw error;
      }
      this.logger.log('Successfully signed out user');
    } catch (error) {
      this.logger.error('Error during signout:');
      this.logger.error(error);
      throw error;
    }
  }

  async getUser(
    token: string,
  ): Promise<{ data: { user: User }; error: Error | null }> {
    try {
      this.logger.log('Attempting to get user data');
      const response = await this.client.auth.getUser(token);
      if (response.error) {
        this.logger.error(`Supabase getUser error: ${response.error.message}`);
        throw response.error;
      }
      this.logger.log(
        `Successfully retrieved user data for ID: ${response.data.user.id}`,
      );
      return { data: { user: response.data.user }, error: null };
    } catch (error) {
      this.logger.error('Error getting user data:');
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Gets the current Supabase client instance
   * @returns SupabaseClient instance
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}
