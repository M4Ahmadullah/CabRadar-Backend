import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LocationService } from '../location/location.service';
import { LocationDto } from '../location/dto/location.dto';
import { EventData } from '../location/location.service';

@WebSocketGateway({
  namespace: 'radar',
  path: '/socket.io',
})
export class RadarWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RadarWebSocketGateway.name);
  private readonly connectedClients: Map<string, Socket> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor(private readonly locationService: LocationService) {}

  handleConnection(client: Socket): void {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) {
        this.logger.warn('Connection attempt without userId');
        client.disconnect();
        return;
      }

      // Check if user is already connected
      if (this.connectedClients.has(userId)) {
        this.logger.warn(
          `User ${userId} already connected, disconnecting old connection`,
        );
        const oldClient = this.connectedClients.get(userId);
        oldClient?.disconnect();
      }

      this.connectedClients.set(userId, client);
      this.logger.log(`Client connected: ${userId}`);

      // Set up error handling for this client
      client.on('error', (error) => {
        this.logger.error(`Socket error for user ${userId}:`, error);
        this.handleClientError(client, error);
      });
    } catch (error) {
      this.logger.error('Error in handleConnection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      const userId = client.handshake.query.userId as string;
      if (userId) {
        this.connectedClients.delete(userId);
        this.logger.log(`Client disconnected: ${userId}`);
      }
    } catch (error) {
      this.logger.error('Error in handleDisconnect:', error);
    }
  }

  private handleClientError(client: Socket, error: Error): void {
    const userId = client.handshake.query.userId as string;
    this.logger.error(`Error for client ${userId}:`, error);

    // Attempt to reconnect if it's a connection error
    if (
      error.message.includes('connect') ||
      error.message.includes('connection')
    ) {
      this.attemptReconnect(client, userId);
    } else {
      client.emit('error', {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      });
    }
  }

  private attemptReconnect(client: Socket, userId: string): void {
    let attempts = 0;
    const reconnect = () => {
      if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
        this.logger.error(
          `Max reconnection attempts reached for user ${userId}`,
        );
        client.disconnect();
        return;
      }

      attempts++;
      this.logger.log(
        `Attempting to reconnect user ${userId} (attempt ${attempts})`,
      );

      setTimeout(() => {
        if (!client.connected) {
          // Instead of trying to reconnect, we'll let the client handle reconnection
          client.emit('reconnect', { attempt: attempts });
        }
      }, this.RECONNECT_DELAY);
    };

    reconnect();
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(
    client: Socket,
    payload: { latitude: number; longitude: number },
  ): Promise<{ success: boolean; events?: EventData[]; error?: string }> {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Validate payload
      if (
        !payload ||
        typeof payload.latitude !== 'number' ||
        typeof payload.longitude !== 'number'
      ) {
        throw new Error('Invalid location data');
      }

      const location: LocationDto = {
        latitude: payload.latitude,
        longitude: payload.longitude,
      };

      // Use existing location service to find nearby events and send notifications
      const nearbyEvents = await this.locationService.getNearbyEvents(
        location,
        1000,
        userId,
      );

      // Send real-time response back to client
      client.emit('nearbyEvents', nearbyEvents);

      return { success: true, events: nearbyEvents };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Error handling location update:', errorMessage);

      // Send detailed error to client
      client.emit('error', {
        code: 'LOCATION_UPDATE_ERROR',
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }
}
