import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  decimalToString,
  roundCurrency,
  ZERO_DECIMAL,
} from '../../common/utils/money.util';
import {
  DOMAIN_EVENTS,
  ExpenseCreatedEvent,
  SaleCreatedEvent,
  WalletUpdatedEvent,
} from '../events/events.constants';
import { EventBusService } from '../events/event-bus.service';
import { WalletRepository } from '../../modules/wallet/repositories/wallet.repository';

@Injectable()
export class WalletEngine {
  private readonly logger = new Logger(WalletEngine.name);

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  @OnEvent(DOMAIN_EVENTS.SALE_CREATED, { async: true })
  async handleSaleCreated(event: SaleCreatedEvent): Promise<void> {
    const saleAmount = roundCurrency(event.amount);
    const updatedWallet = await this.walletRepository.updateWalletBalances({
      partnerId: event.receivedByPartnerId,
      cashDelta: event.paymentMode === 'CASH' ? saleAmount : ZERO_DECIMAL,
      onlineDelta: event.paymentMode === 'ONLINE' ? saleAmount : ZERO_DECIMAL,
      updatedAt: new Date(event.timestamp),
    });

    const walletUpdatedEvent: WalletUpdatedEvent = {
      partnerId: updatedWallet.partnerId,
      partnerName: updatedWallet.partner.name,
      cashBalance: decimalToString(updatedWallet.cashBalance),
      onlineBalance: decimalToString(updatedWallet.onlineBalance),
      totalBalance: decimalToString(updatedWallet.totalBalance),
      sourceEvent: DOMAIN_EVENTS.SALE_CREATED,
      sourceEntityId: event.saleId,
      updatedAt:
        updatedWallet.lastCalculatedAt?.toISOString() ?? new Date().toISOString(),
    };

    this.logger.log(
      `Wallet updated for partner ${updatedWallet.partner.name} after sale ${event.saleId}`,
    );
    this.eventBusService.emit(DOMAIN_EVENTS.WALLET_UPDATED, walletUpdatedEvent);
  }

  @OnEvent(DOMAIN_EVENTS.EXPENSE_CREATED, { async: true })
  async handleExpenseCreated(event: ExpenseCreatedEvent): Promise<void> {
    const expenseAmount = roundCurrency(event.amount).negated();
    const updatedWallet = await this.walletRepository.updateWalletBalances({
      partnerId: event.paidByPartnerId,
      cashDelta: event.paymentSource === 'CASH' ? expenseAmount : ZERO_DECIMAL,
      onlineDelta:
        event.paymentSource === 'ONLINE' ? expenseAmount : ZERO_DECIMAL,
      updatedAt: new Date(event.timestamp),
    });

    const walletUpdatedEvent: WalletUpdatedEvent = {
      partnerId: updatedWallet.partnerId,
      partnerName: updatedWallet.partner.name,
      cashBalance: decimalToString(updatedWallet.cashBalance),
      onlineBalance: decimalToString(updatedWallet.onlineBalance),
      totalBalance: decimalToString(updatedWallet.totalBalance),
      sourceEvent: DOMAIN_EVENTS.EXPENSE_CREATED,
      sourceEntityId: event.expenseId,
      updatedAt:
        updatedWallet.lastCalculatedAt?.toISOString() ?? new Date().toISOString(),
    };

    this.logger.log(
      `Wallet updated for partner ${updatedWallet.partner.name} after expense ${event.expenseId}`,
    );
    this.eventBusService.emit(DOMAIN_EVENTS.WALLET_UPDATED, walletUpdatedEvent);
  }
}
