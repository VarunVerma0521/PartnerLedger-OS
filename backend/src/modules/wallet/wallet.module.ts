import { Module } from '@nestjs/common';
import { WalletRepository } from './repositories/wallet.repository';

@Module({
  providers: [WalletRepository],
  exports: [WalletRepository],
})
export class WalletModule {}
