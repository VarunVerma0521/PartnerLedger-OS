import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AlertTriggeredEvent,
  DOMAIN_EVENTS,
  ExpenseCreatedEvent,
  InsightGeneratedEvent,
  SaleCreatedEvent,
  SettlementRecalculatedEvent,
  WalletUpdatedEvent,
} from '../core/events/events.constants';
import { DashboardRepository } from '../modules/dashboard/repositories/dashboard.repository';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class GatewayBroadcastService {
  constructor(
    private readonly realtimeGateway: RealtimeGateway,
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  @OnEvent(DOMAIN_EVENTS.SALE_CREATED, { async: true })
  handleSaleCreated(event: SaleCreatedEvent): void {
    this.realtimeGateway.emitTransaction({
      type: 'sale',
      payload: event,
    });
  }

  @OnEvent(DOMAIN_EVENTS.EXPENSE_CREATED, { async: true })
  handleExpenseCreated(event: ExpenseCreatedEvent): void {
    this.realtimeGateway.emitTransaction({
      type: 'expense',
      payload: event,
    });
  }

  @OnEvent(DOMAIN_EVENTS.WALLET_UPDATED, { async: true })
  async handleWalletUpdated(event: WalletUpdatedEvent): Promise<void> {
    const dashboardSnapshot = await this.dashboardRepository.getDashboardSnapshot();

    this.realtimeGateway.emitDashboardUpdate({
      reason: DOMAIN_EVENTS.WALLET_UPDATED,
      snapshot: dashboardSnapshot,
      wallet: event,
    });
  }

  @OnEvent(DOMAIN_EVENTS.SETTLEMENT_RECALCULATED, { async: true })
  async handleSettlementRecalculated(
    event: SettlementRecalculatedEvent,
  ): Promise<void> {
    const dashboardSnapshot = await this.dashboardRepository.getDashboardSnapshot();

    this.realtimeGateway.emitSettlement(event);
    this.realtimeGateway.emitDashboardUpdate({
      reason: DOMAIN_EVENTS.SETTLEMENT_RECALCULATED,
      snapshot: dashboardSnapshot,
      settlement: event,
    });
  }

  @OnEvent(DOMAIN_EVENTS.INSIGHT_GENERATED, { async: true })
  handleInsightGenerated(event: InsightGeneratedEvent): void {
    this.realtimeGateway.emitInsight(event);
  }

  @OnEvent(DOMAIN_EVENTS.ALERT_TRIGGERED, { async: true })
  async handleAlertTriggered(event: AlertTriggeredEvent): Promise<void> {
    const dashboardSnapshot = await this.dashboardRepository.getDashboardSnapshot();

    this.realtimeGateway.emitAlert(event);
    this.realtimeGateway.emitDashboardUpdate({
      reason: DOMAIN_EVENTS.ALERT_TRIGGERED,
      snapshot: dashboardSnapshot,
      alert: event,
    });
  }
}
