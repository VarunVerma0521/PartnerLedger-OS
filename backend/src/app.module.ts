import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.schema';
import { CoreEnginesModule } from './core/engines/core-engines.module';
import { EventBusModule } from './core/events/event-bus.module';
import { GatewayModule } from './gateway/gateway.module';
import { AlertModule } from './modules/alert/alert.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { InsightModule } from './modules/insight/insight.module';
import { LogsModule } from './modules/logs/logs.module';
import { PartnerModule } from './modules/partners/partner.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SalesModule } from './modules/sales/sales.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { SettlementsModule } from './modules/settlements/settlement.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    EventEmitterModule.forRoot({
      global: true,
      wildcard: false,
      delimiter: '.',
      maxListeners: 30,
      verboseMemoryLeak: true,
    }),
    PrismaModule,
    EventBusModule,
    CoreEnginesModule,
    GatewayModule,
    AuthModule,
    PartnerModule,
    SalesModule,
    ExpensesModule,
    WalletModule,
    SettlementModule,
    SettlementsModule,
    DashboardModule,
    InsightModule,
    AlertModule,
    LogsModule,
    ReportsModule,
  ],
})
export class AppModule {}
