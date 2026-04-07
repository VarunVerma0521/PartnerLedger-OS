import { Module } from '@nestjs/common';
import { SettlementModule as SettlementDataModule } from '../settlement/settlement.module';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';

@Module({
  imports: [SettlementDataModule],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementsModule {}
