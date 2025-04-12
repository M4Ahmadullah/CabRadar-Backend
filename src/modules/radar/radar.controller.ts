import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { RadarService } from './radar.service';
import { LocationUpdateDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NearbyEvent } from './interfaces/nearby-event.interface';
import { NearbyEventDto } from './dto/nearby-event.dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@ApiTags('radar')
@Controller('radar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RadarController {
  constructor(private readonly radarService: RadarService) {}

  @Post('location')
  @ApiOperation({ summary: 'Update user location and get nearby events' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully and returns nearby events',
    type: [NearbyEventDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLocation(
    @Body() location: LocationUpdateDto,
    @Req() req: RequestWithUser,
  ): Promise<NearbyEvent[]> {
    const userId = req.user.sub;
    return this.radarService.updateLocation(userId, location);
  }
}
