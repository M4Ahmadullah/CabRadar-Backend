import { Module } from '@nestjs/common';
import { RadarWebSocketGateway } from './websocket.gateway';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LocationModule],
  providers: [RadarWebSocketGateway],
  exports: [RadarWebSocketGateway],
})
export class WebSocketModule {}
