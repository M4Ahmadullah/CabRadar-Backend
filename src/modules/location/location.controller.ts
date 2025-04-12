import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationDto } from './dto/location.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('nearby-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get nearby events and receive notifications' })
  @ApiResponse({ status: 200, description: 'Returns nearby events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNearbyEvents(
    @Req() req: RequestWithUser,
    @Body() location: LocationDto,
  ): Promise<any[]> {
    return this.locationService.getNearbyEvents(location, 1000, req.user.id);
  }
}
