import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InsightType, Prisma } from '@prisma/client';
import { addUtcDays, startOfUtcDay } from '../../common/utils/date.util';
import {
  decimalToNumber,
  decimalToString,
} from '../../common/utils/money.util';
import {
  DOMAIN_EVENTS,
  ExpenseCreatedEvent,
  InsightGeneratedEvent,
  SaleCreatedEvent,
} from '../events/events.constants';
import { EventBusService } from '../events/event-bus.service';
import {
  InsightCreateInput,
  InsightRepository,
} from '../../modules/insight/repositories/insight.repository';
import { SettlementRepository } from '../../modules/settlement/repositories/settlement.repository';

const EXPENSE_SPIKE_THRESHOLD = new Prisma.Decimal(1.2);
const PROFIT_DROP_THRESHOLD = new Prisma.Decimal(0.8);
const EXPENSE_LOOKBACK_DAYS = 3;

@Injectable()
export class InsightEngine {
  private readonly logger = new Logger(InsightEngine.name);

  constructor(
    private readonly settlementRepository: SettlementRepository,
    private readonly insightRepository: InsightRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  @OnEvent(DOMAIN_EVENTS.SALE_CREATED, { async: true })
  @OnEvent(DOMAIN_EVENTS.EXPENSE_CREATED, { async: true })
  async handleTransactionEvent(
    event: SaleCreatedEvent | ExpenseCreatedEvent,
  ): Promise<void> {
    const referenceDate = startOfUtcDay(new Date(event.timestamp));
    const previousDay = addUtcDays(referenceDate, -1);
    const [todayTotals, previousDayTotals, averageHistoricalExpenses] =
      await Promise.all([
        this.settlementRepository.getDailyTotals(referenceDate),
        this.settlementRepository.getDailyTotals(previousDay),
        this.settlementRepository.getAverageDailyExpensesBefore(
          referenceDate,
          EXPENSE_LOOKBACK_DAYS,
        ),
      ]);

    const insightsToPersist: InsightCreateInput[] = [];

    if (
      averageHistoricalExpenses.greaterThan(0) &&
      todayTotals.totalExpenses.greaterThan(
        averageHistoricalExpenses.mul(EXPENSE_SPIKE_THRESHOLD),
      )
    ) {
      const spikeRatio = todayTotals.totalExpenses
        .div(averageHistoricalExpenses)
        .minus(1)
        .mul(100)
        .toDecimalPlaces(0);

      insightsToPersist.push({
        type: InsightType.EXPENSE_SPIKE,
        title: 'Expense spike detected',
        description: `Expenses for ${referenceDate.toISOString().slice(0, 10)} are ${spikeRatio.toString()}% above the trailing ${EXPENSE_LOOKBACK_DAYS}-day average.`,
        score: decimalToNumber(spikeRatio),
        referenceDate,
        metadata: {
          totalExpenses: decimalToString(todayTotals.totalExpenses),
          averageExpenses: decimalToString(averageHistoricalExpenses),
        },
      });
    }

    if (
      previousDayTotals.profit.greaterThan(0) &&
      todayTotals.profit.lessThan(previousDayTotals.profit.mul(PROFIT_DROP_THRESHOLD))
    ) {
      const dropRatio = previousDayTotals.profit
        .minus(todayTotals.profit)
        .div(previousDayTotals.profit)
        .mul(100)
        .toDecimalPlaces(0);

      insightsToPersist.push({
        type: InsightType.PROFIT_DROP,
        title: 'Profit drop detected',
        description: `Profit for ${referenceDate.toISOString().slice(0, 10)} is down ${dropRatio.toString()}% versus the previous day.`,
        score: decimalToNumber(dropRatio),
        referenceDate,
        metadata: {
          currentProfit: decimalToString(todayTotals.profit),
          previousProfit: decimalToString(previousDayTotals.profit),
        },
      });
    }

    const createdInsights = await this.insightRepository.replaceInsightsForReferenceDate(
      {
        referenceDate,
        managedTypes: [InsightType.EXPENSE_SPIKE, InsightType.PROFIT_DROP],
        insights: insightsToPersist,
      },
    );

    for (const createdInsight of createdInsights) {
      const insightEvent: InsightGeneratedEvent = {
        insightId: createdInsight.id,
        type: createdInsight.type,
        title: createdInsight.title,
        description: createdInsight.description,
        score: createdInsight.score,
        referenceDate: createdInsight.referenceDate?.toISOString() ?? null,
      };

      this.eventBusService.emit(DOMAIN_EVENTS.INSIGHT_GENERATED, insightEvent);
    }

    this.logger.log(
      `Insight analysis completed for ${referenceDate.toISOString().slice(0, 10)} with ${createdInsights.length} insight(s)`,
    );
  }
}
