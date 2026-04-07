import { Module } from '@nestjs/common';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { GatewayBroadcastService } from './gateway-broadcast.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [DashboardModule],
  providers: [RealtimeGateway, GatewayBroadcastService],
  exports: [RealtimeGateway],
})
export class GatewayModule {}
