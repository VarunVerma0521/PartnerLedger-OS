import { Module } from '@nestjs/common';
import { SettlementRepository } from './repositories/settlement.repository';

@Module({
  providers: [SettlementRepository],
  exports: [SettlementRepository],
})
export class SettlementModule {}
