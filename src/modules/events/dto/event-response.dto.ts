import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '../enums/event-type.enum';

export class EventResponseDto {
  @ApiProperty({ description: 'Unique identifier of the event' })
  id: string;

  @ApiProperty({ enum: EventType, description: 'Type of the event' })
  type: EventType;

  @ApiProperty({ description: 'Title of the event' })
  title: string;

  @ApiProperty({ description: 'Description of the event', required: false })
  description?: string;

  @ApiProperty({ description: 'Latitude of the event location' })
  latitude: number;

  @ApiProperty({ description: 'Longitude of the event location' })
  longitude: number;

  @ApiProperty({
    description: 'Address of the event location',
    required: false,
  })
  address?: string;

  @ApiProperty({ description: 'Radius of the event in meters' })
  radius: number;

  @ApiProperty({ description: 'ID of the user who created the event' })
  userId: string;

  @ApiProperty({ description: 'Timestamp when the event was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the event was last updated' })
  updatedAt: Date;
}
