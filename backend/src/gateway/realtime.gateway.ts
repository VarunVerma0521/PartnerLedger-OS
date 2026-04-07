import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../core/events/events.constants';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit(): void {
    this.logger.log('Realtime Socket.IO gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  sendUpdate(eventName: string, payload: unknown): void {
    this.server.emit(eventName, payload);
  }

  emitDashboardUpdate(payload: unknown): void {
    this.sendUpdate(SOCKET_EVENTS.DASHBOARD_UPDATED, payload);
  }

  emitAlert(payload: unknown): void {
    this.sendUpdate(SOCKET_EVENTS.ALERT_CREATED, payload);
  }

  emitTransaction(payload: unknown): void {
    this.sendUpdate(SOCKET_EVENTS.TRANSACTION_CREATED, payload);
  }

  emitSettlement(payload: unknown): void {
    this.sendUpdate(SOCKET_EVENTS.SETTLEMENT_UPDATED, payload);
  }

  emitInsight(payload: unknown): void {
    this.sendUpdate(SOCKET_EVENTS.INSIGHT_CREATED, payload);
  }
}
