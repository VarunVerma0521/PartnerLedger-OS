import { Module } from '@nestjs/common';
import { AlertEngine } from './alert.engine';
import { InsightEngine } from './insight.engine';
import { SettlementEngine } from './settlement.engine';
import { WalletEngine } from './wallet.engine';
import { AlertModule } from '../../modules/alert/alert.module';
import { InsightModule } from '../../modules/insight/insight.module';
import { SettlementModule } from '../../modules/settlement/settlement.module';
import { WalletModule } from '../../modules/wallet/wallet.module';

@Module({
  imports: [WalletModule, SettlementModule, InsightModule, AlertModule],
  providers: [WalletEngine, SettlementEngine, InsightEngine, AlertEngine],
  exports: [WalletEngine, SettlementEngine, InsightEngine, AlertEngine],
})
export class CoreEnginesModule {}
