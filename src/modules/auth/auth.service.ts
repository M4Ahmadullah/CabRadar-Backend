import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResult, User } from './interfaces/auth.interface';

/**
 * AuthService handles user authentication and authorization.
 * It integrates with Supabase for authentication and Prisma for user data storage.
 *
 * Key responsibilities:
 * - User registration (signup)
 * - User authentication (signin)
 * - User data synchronization between Supabase and local database
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private createUserResponse(user: {
    id: string;
    email: string;
    name: string;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  /**
   * Registers a new user in the system
   * 1. Creates user in Supabase Auth
   * 2. Creates corresponding user record in local database
   * 3. Returns authentication result
   *
   * @param signUpDto - User registration data
   * @returns Promise containing auth result with user and session info
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResult> {
    try {
      // Create user in Supabase Auth
      const supabaseResult = await this.supabase.signUp(
        signUpDto.email,
        signUpDto.password,
      );

      if (supabaseResult.error) {
        throw supabaseResult.error;
      }

      if (!supabaseResult.data?.user) {
        throw new Error('Failed to create user: No user data returned');
      }

      // Create user in local database
      const user = await this.prisma.user.create({
        data: {
          authId: supabaseResult.data.user.id,
          email: signUpDto.email,
          name: signUpDto.name,
        },
      });

      this.logger.log(`User created successfully: ${user.email}`);
      return {
        user: this.createUserResponse(user),
        session: supabaseResult.data.session,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('already registered')
      ) {
        throw new ConflictException('Email already registered');
      }
      this.logger.error('Error during signup:', error);
      throw error;
    }
  }

  /**
   * Authenticates an existing user
   * 1. Verifies credentials with Supabase Auth
   * 2. Returns authentication result
   *
   * @param signInDto - User login credentials
   * @returns Promise containing auth result with user and session info
   */
  async signIn(signInDto: SignInDto): Promise<AuthResult> {
    try {
      const result = await this.supabase.signIn(
        signInDto.email,
        signInDto.password,
      );

      if (result.error) {
        throw result.error;
      }

      if (!result.data?.user) {
        throw new Error('User not found');
      }

      const user = await this.prisma.user.findUnique({
        where: { authId: result.data.user.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found in local database');
      }

      this.logger.log(`User signed in successfully: ${signInDto.email}`);
      return {
        user: this.createUserResponse(user),
        session: result.data.session,
      };
    } catch (error) {
      this.logger.error('Error during signin:', error);
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Failed to sign in',
      );
    }
  }

  async validateUser(authId: string) {
    const user = await this.prisma.user.findUnique({
      where: { authId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
