import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlertSeverity, AlertType, Prisma } from '@prisma/client';
import { startOfUtcDay } from '../../common/utils/date.util';
import {
  decimalAbs,
  decimalToString,
} from '../../common/utils/money.util';
import {
  AlertTriggeredEvent,
  DOMAIN_EVENTS,
  ExpenseCreatedEvent,
  SaleCreatedEvent,
  SettlementRecalculatedEvent,
} from '../events/events.constants';
import { EventBusService } from '../events/event-bus.service';
import {
  AlertCreateInput,
  AlertRepository,
} from '../../modules/alert/repositories/alert.repository';
import { SettlementRepository } from '../../modules/settlement/repositories/settlement.repository';

const HIGH_IMBALANCE_RATIO_THRESHOLD = new Prisma.Decimal(0.25);

@Injectable()
export class AlertEngine {
  private readonly logger = new Logger(AlertEngine.name);

  constructor(
    private readonly settlementRepository: SettlementRepository,
    private readonly alertRepository: AlertRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  @OnEvent(DOMAIN_EVENTS.SALE_CREATED, { async: true })
  @OnEvent(DOMAIN_EVENTS.EXPENSE_CREATED, { async: true })
  async handleTransactionEvent(
    event: SaleCreatedEvent | ExpenseCreatedEvent,
  ): Promise<void> {
    const referenceDate = startOfUtcDay(new Date(event.timestamp));
    const dailyTotals = await this.settlementRepository.getDailyTotals(referenceDate);
    const alertsToPersist: AlertCreateInput[] = [];

    if (dailyTotals.profit.lessThan(0)) {
      alertsToPersist.push({
        type: AlertType.LOSS_DAY,
        severity: AlertSeverity.HIGH,
        title: 'Loss day detected',
        message: `Profit for ${referenceDate.toISOString().slice(0, 10)} is negative at ${decimalToString(dailyTotals.profit)}.`,
        referenceDate,
        metadata: {
          profit: decimalToString(dailyTotals.profit),
        },
      });
    }

    if (
      dailyTotals.totalExpenses.greaterThan(dailyTotals.totalSales) &&
      dailyTotals.totalExpenses.greaterThan(0)
    ) {
      alertsToPersist.push({
        type: AlertType.OVERSPENDING,
        severity: AlertSeverity.HIGH,
        title: 'Overspending detected',
        message: `Expenses for ${referenceDate.toISOString().slice(0, 10)} exceed sales by ${decimalToString(dailyTotals.totalExpenses.minus(dailyTotals.totalSales))}.`,
        referenceDate,
        metadata: {
          totalSales: decimalToString(dailyTotals.totalSales),
          totalExpenses: decimalToString(dailyTotals.totalExpenses),
        },
      });
    }

    if (dailyTotals.totalSales.equals(0)) {
      alertsToPersist.push({
        type: AlertType.NO_SALES,
        severity: AlertSeverity.MEDIUM,
        title: 'No sales recorded',
        message: `No sales have been recorded for ${referenceDate.toISOString().slice(0, 10)} so far.`,
        referenceDate,
        metadata: {
          totalExpenses: decimalToString(dailyTotals.totalExpenses),
        },
      });
    }

    const createdAlerts = await this.alertRepository.replaceAlertsForReferenceDate({
      referenceDate,
      managedTypes: [AlertType.LOSS_DAY, AlertType.OVERSPENDING, AlertType.NO_SALES],
      alerts: alertsToPersist,
    });

    for (const createdAlert of createdAlerts) {
      const alertEvent: AlertTriggeredEvent = {
        alertId: createdAlert.id,
        type: createdAlert.type,
        severity: createdAlert.severity,
        title: createdAlert.title,
        message: createdAlert.message,
        referenceDate: createdAlert.referenceDate?.toISOString() ?? null,
      };

      this.eventBusService.emit(DOMAIN_EVENTS.ALERT_TRIGGERED, alertEvent);
    }

    this.logger.log(
      `Alert scan completed for ${referenceDate.toISOString().slice(0, 10)} with ${createdAlerts.length} alert(s)`,
    );
  }

  @OnEvent(DOMAIN_EVENTS.SETTLEMENT_RECALCULATED, { async: true })
  async handleSettlementRecalculated(
    event: SettlementRecalculatedEvent,
  ): Promise<void> {
    const referenceDate = startOfUtcDay(new Date(event.referenceDate));
    const totalSales = new Prisma.Decimal(event.totalSales);
    const largestImbalance = event.partnerPositions.reduce(
      (currentLargest, partner) => {
        const absoluteNetBalance = decimalAbs(partner.netBalance);
        return absoluteNetBalance.greaterThan(currentLargest)
          ? absoluteNetBalance
          : currentLargest;
      },
      new Prisma.Decimal(0),
    );
    const imbalanceRatio = totalSales.greaterThan(0)
      ? largestImbalance.div(totalSales)
      : new Prisma.Decimal(event.transferCount > 0 ? 1 : 0);
    const imbalanceAlerts: AlertCreateInput[] = [];

    if (
      event.transferCount > 0 &&
      imbalanceRatio.greaterThanOrEqualTo(HIGH_IMBALANCE_RATIO_THRESHOLD)
    ) {
      imbalanceAlerts.push({
        type: AlertType.IMBALANCE,
        severity: AlertSeverity.HIGH,
        title: 'High partner imbalance detected',
        message: `Settlement imbalance reached ${decimalToString(largestImbalance)} across partner wallets.`,
        referenceDate,
        metadata: {
          totalTransferAmount: event.totalTransferAmount,
          largestImbalance: decimalToString(largestImbalance),
          transferCount: event.transferCount,
        },
      });
    }

    const createdAlerts = await this.alertRepository.replaceAlertsForReferenceDate({
      referenceDate,
      managedTypes: [AlertType.IMBALANCE],
      alerts: imbalanceAlerts,
    });

    for (const createdAlert of createdAlerts) {
      const alertEvent: AlertTriggeredEvent = {
        alertId: createdAlert.id,
        type: createdAlert.type,
        severity: createdAlert.severity,
        title: createdAlert.title,
        message: createdAlert.message,
        referenceDate: createdAlert.referenceDate?.toISOString() ?? null,
      };

      this.eventBusService.emit(DOMAIN_EVENTS.ALERT_TRIGGERED, alertEvent);
    }
  }
}
