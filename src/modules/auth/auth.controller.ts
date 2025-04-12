import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { CanActivate } from '@nestjs/common';
import { AuthResult } from './interfaces/auth.interface';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

/**
 * AuthController handles HTTP requests for user authentication.
 * It provides endpoints for user registration and login.
 *
 * Endpoints:
 * - POST /auth/signup - Register a new user
 * - POST /auth/signin - Authenticate an existing user
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * User registration endpoint
   * Accepts user registration data and returns authentication result
   *
   * @param signUpDto - User registration data (email, password, name)
   * @returns Promise containing auth result with user and session info
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResult> {
    return this.authService.signUp(signUpDto);
  }

  /**
   * User authentication endpoint
   * Accepts login credentials and returns authentication result
   *
   * @param signInDto - User login credentials (email, password)
   * @returns Promise containing auth result with user and session info
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResult> {
    return this.authService.signIn(signInDto);
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard as unknown as CanActivate)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FCM token for the authenticated user' })
  @ApiResponse({ status: 200, description: 'FCM token updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateFcmToken(
    @Req() req: RequestWithUser,
    @Body('token') token: string,
  ): Promise<{ message: string }> {
    try {
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: { fcmToken: token },
      });
      return { message: 'FCM token updated successfully' };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update FCM token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
