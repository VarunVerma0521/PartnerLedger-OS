import { Module } from '@nestjs/common';
import { AlertRepository } from './repositories/alert.repository';

@Module({
  providers: [AlertRepository],
  exports: [AlertRepository],
})
export class AlertModule {}
