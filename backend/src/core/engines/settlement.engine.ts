import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import {
  decimalAbs,
  decimalToString,
  roundCurrency,
  ZERO_DECIMAL,
} from '../../common/utils/money.util';
import {
  DOMAIN_EVENTS,
  SettlementPartnerPositionEvent,
  SettlementRecalculatedEvent,
  SettlementTransferEvent,
  WalletUpdatedEvent,
} from '../events/events.constants';
import { EventBusService } from '../events/event-bus.service';
import { SettlementRepository } from '../../modules/settlement/repositories/settlement.repository';
import { LIVE_SETTLEMENT_BATCH_KEY } from './settlement.constants';

const MIN_SETTLEMENT_AMOUNT = new Prisma.Decimal(0.01);

@Injectable()
export class SettlementEngine {
  private readonly logger = new Logger(SettlementEngine.name);

  constructor(
    private readonly settlementRepository: SettlementRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  @OnEvent(DOMAIN_EVENTS.WALLET_UPDATED, { async: true })
  async handleWalletUpdated(event: WalletUpdatedEvent): Promise<void> {
    this.logger.log(
      `Settlement recalculation queued after wallet update for partner ${event.partnerId}`,
    );

    const snapshot = await this.settlementRepository.getSettlementSnapshot();
    const totalSales = roundCurrency(snapshot.totalSales);
    const totalExpenses = roundCurrency(snapshot.totalExpenses);
    const profit = roundCurrency(totalSales.minus(totalExpenses));

    const partnerPositions: Array<
      SettlementPartnerPositionEvent & {
        remainingNetBalance: Prisma.Decimal;
      }
    > = snapshot.partners.map((partner) => {
      const walletBalance = roundCurrency(partner.wallet?.totalBalance ?? ZERO_DECIMAL);
      const expectedShare = roundCurrency(
        profit.mul(partner.ownershipPercentage).div(100),
      );
      const netBalance = roundCurrency(walletBalance.minus(expectedShare));

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        ownershipPercentage: decimalToString(partner.ownershipPercentage),
        walletBalance: decimalToString(walletBalance),
        expectedShare: decimalToString(expectedShare),
        netBalance: decimalToString(netBalance),
        remainingNetBalance: netBalance,
      };
    });

    const creditors = partnerPositions
      .filter((partner) =>
        partner.remainingNetBalance.greaterThanOrEqualTo(MIN_SETTLEMENT_AMOUNT),
      )
      .sort((left, right) =>
        right.remainingNetBalance.comparedTo(left.remainingNetBalance),
      )
      .map((partner) => ({
        ...partner,
        remainingAmount: roundCurrency(partner.remainingNetBalance),
      }));

    const debtors = partnerPositions
      .filter((partner) =>
        partner.remainingNetBalance.lessThanOrEqualTo(
          MIN_SETTLEMENT_AMOUNT.negated(),
        ),
      )
      .sort((left, right) =>
        left.remainingNetBalance.comparedTo(right.remainingNetBalance),
      )
      .map((partner) => ({
        ...partner,
        remainingAmount: decimalAbs(partner.remainingNetBalance),
      }));

    const transfers: SettlementTransferEvent[] = [];
    const persistedTransfers: Parameters<
      SettlementRepository['replaceLiveSettlements']
    >[0]['transfers'] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    let totalTransferAmount = ZERO_DECIMAL;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      const transferAmount = creditor.remainingAmount.lessThan(debtor.remainingAmount)
        ? creditor.remainingAmount
        : debtor.remainingAmount;
      const roundedTransferAmount = roundCurrency(transferAmount);

      if (roundedTransferAmount.lessThan(MIN_SETTLEMENT_AMOUNT)) {
        if (creditor.remainingAmount.lessThan(MIN_SETTLEMENT_AMOUNT)) {
          creditorIndex += 1;
        }

        if (debtor.remainingAmount.lessThan(MIN_SETTLEMENT_AMOUNT)) {
          debtorIndex += 1;
        }

        continue;
      }

      transfers.push({
        fromPartnerId: debtor.partnerId,
        fromPartnerName: debtor.partnerName,
        toPartnerId: creditor.partnerId,
        toPartnerName: creditor.partnerName,
        amount: decimalToString(roundedTransferAmount),
      });

      persistedTransfers.push({
        fromPartnerId: debtor.partnerId,
        fromPartnerName: debtor.partnerName,
        toPartnerId: creditor.partnerId,
        toPartnerName: creditor.partnerName,
        amount: roundedTransferAmount,
        expectedShare: new Prisma.Decimal(debtor.expectedShare),
        walletBalance: new Prisma.Decimal(debtor.walletBalance),
        netBalance: new Prisma.Decimal(debtor.netBalance),
        metadata: {
          fromPartnerName: debtor.partnerName,
          toPartnerName: creditor.partnerName,
          totalSales: decimalToString(totalSales),
          totalExpenses: decimalToString(totalExpenses),
          profit: decimalToString(profit),
        },
      });

      creditor.remainingAmount = roundCurrency(
        creditor.remainingAmount.minus(roundedTransferAmount),
      );
      debtor.remainingAmount = roundCurrency(
        debtor.remainingAmount.minus(roundedTransferAmount),
      );
      totalTransferAmount = roundCurrency(
        totalTransferAmount.plus(roundedTransferAmount),
      );

      if (creditor.remainingAmount.lessThan(MIN_SETTLEMENT_AMOUNT)) {
        creditorIndex += 1;
      }

      if (debtor.remainingAmount.lessThan(MIN_SETTLEMENT_AMOUNT)) {
        debtorIndex += 1;
      }
    }

    const recalculationDate = new Date(event.updatedAt);

    await this.settlementRepository.replaceLiveSettlements({
      batchKey: LIVE_SETTLEMENT_BATCH_KEY,
      referenceDate: recalculationDate,
      transfers: persistedTransfers,
    });

    const settlementEvent: SettlementRecalculatedEvent = {
      batchKey: LIVE_SETTLEMENT_BATCH_KEY,
      referenceDate: recalculationDate.toISOString(),
      transferCount: transfers.length,
      totalTransferAmount: decimalToString(totalTransferAmount),
      totalSales: decimalToString(totalSales),
      totalExpenses: decimalToString(totalExpenses),
      profit: decimalToString(profit),
      transfers,
      partnerPositions: partnerPositions.map((partner) => ({
        partnerId: partner.partnerId,
        partnerName: partner.partnerName,
        ownershipPercentage: partner.ownershipPercentage,
        walletBalance: partner.walletBalance,
        expectedShare: partner.expectedShare,
        netBalance: partner.netBalance,
      })),
    };

    this.logger.log(
      `Settlement recalculated with ${transfers.length} transfer suggestion(s)`,
    );
    this.eventBusService.emit(
      DOMAIN_EVENTS.SETTLEMENT_RECALCULATED,
      settlementEvent,
    );
  }
}
