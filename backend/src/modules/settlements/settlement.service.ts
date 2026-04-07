import { Injectable } from '@nestjs/common';
import { decimalToNumber } from '../../common/utils/money.util';
import { LIVE_SETTLEMENT_BATCH_KEY } from '../../core/engines/settlement.constants';
import { SettlementRepository } from '../settlement/repositories/settlement.repository';

export type SettlementReadResponse = {
  settlements: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
};

@Injectable()
export class SettlementService {
  constructor(private readonly settlementRepository: SettlementRepository) {}

  async getSettlements(): Promise<SettlementReadResponse> {
    const settlements = await this.settlementRepository.getLiveSettlements(
      LIVE_SETTLEMENT_BATCH_KEY,
    );

    return {
      settlements: settlements.map((settlement) => ({
        from: settlement.fromPartner.name,
        to: settlement.toPartner.name,
        amount: decimalToNumber(settlement.amount),
      })),
    };
  }
}
