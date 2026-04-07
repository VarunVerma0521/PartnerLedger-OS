import { Module } from '@nestjs/common';
import { InsightRepository } from './repositories/insight.repository';

@Module({
  providers: [InsightRepository],
  exports: [InsightRepository],
})
export class InsightModule {}
