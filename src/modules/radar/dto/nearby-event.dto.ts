import { ApiProperty } from '@nestjs/swagger';
import { NearbyEvent } from '../interfaces/nearby-event.interface';

export class NearbyEventDto implements NearbyEvent {
  @ApiProperty({
    example: 'GekhGJWH5xpzDpnYca',
    description: 'Unique identifier of the event',
  })
  id!: string;

  @ApiProperty({
    example: 'London Film Fair',
    description: 'Title of the event',
  })
  title!: string;

  @ApiProperty({
    example: '2025-04-06 16:00:00+00',
    description: 'End time of the event in local timezone',
  })
  end_local!: string;

  @ApiProperty({
    example: 51.523549,
    description: 'Latitude of the event location',
  })
  lat!: number;

  @ApiProperty({
    example: '-0.127721',
    description: 'Longitude of the event location',
  })
  lon!: string;

  @ApiProperty({ example: 750, description: 'Distance from user in meters' })
  distance!: number;
}
