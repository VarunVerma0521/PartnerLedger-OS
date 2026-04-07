import { Injectable } from '@nestjs/common';
import { Partner, Prisma, Settlement, Wallet } from '@prisma/client';
import {
  endOfUtcDayExclusive,
  startOfUtcDay,
} from '../../../common/utils/date.util';
import { PrismaService } from '../../../prisma/prisma.service';

export type SettlementPartnerRecord = Partner & {
  wallet: Wallet | null;
};

export type SettlementSnapshot = {
  totalSales: Prisma.Decimal;
  totalExpenses: Prisma.Decimal;
  partners: SettlementPartnerRecord[];
};

export type PersistedSettlementTransfer = {
  fromPartnerId: string;
  fromPartnerName: string;
  toPartnerId: string;
  toPartnerName: string;
  amount: Prisma.Decimal;
  expectedShare: Prisma.Decimal;
  walletBalance: Prisma.Decimal;
  netBalance: Prisma.Decimal;
  metadata: Prisma.InputJsonValue;
};

export type DailyTotals = {
  totalSales: Prisma.Decimal;
  totalExpenses: Prisma.Decimal;
  profit: Prisma.Decimal;
};

export type LiveSettlementRecord = Prisma.SettlementGetPayload<{
  include: {
    fromPartner: {
      select: {
        id: true;
        name: true;
      };
    };
    toPartner: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class SettlementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettlementSnapshot(): Promise<SettlementSnapshot> {
    const [salesAggregate, expensesAggregate, partners] =
      await this.prisma.$transaction([
        this.prisma.sale.aggregate({
          _sum: {
            amount: true,
          },
        }),
        this.prisma.expense.aggregate({
          _sum: {
            amount: true,
          },
        }),
        this.prisma.partner.findMany({
          where: {
            isActive: true,
          },
          include: {
            wallet: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
      ]);

    return {
      totalSales: salesAggregate._sum.amount ?? new Prisma.Decimal(0),
      totalExpenses: expensesAggregate._sum.amount ?? new Prisma.Decimal(0),
      partners,
    };
  }

  async replaceLiveSettlements(params: {
    batchKey: string;
    referenceDate: Date;
    transfers: PersistedSettlementTransfer[];
  }): Promise<Settlement[]> {
    const { batchKey, referenceDate, transfers } = params;

    return this.prisma.$transaction(async (transaction) => {
      await transaction.settlement.deleteMany({
        where: {
          batchKey,
        },
      });

      const createdSettlements: Settlement[] = [];

      for (const transfer of transfers) {
        const createdSettlement = await transaction.settlement.create({
          data: {
            batchKey,
            referenceDate,
            fromPartnerId: transfer.fromPartnerId,
            toPartnerId: transfer.toPartnerId,
            amount: transfer.amount,
            expectedShare: transfer.expectedShare,
            walletBalance: transfer.walletBalance,
            netBalance: transfer.netBalance,
            metadata: transfer.metadata,
          },
        });

        createdSettlements.push(createdSettlement);
      }

      return createdSettlements;
    });
  }

  getLiveSettlements(batchKey: string): Promise<LiveSettlementRecord[]> {
    return this.prisma.settlement.findMany({
      where: {
        batchKey,
      },
      include: {
        fromPartner: {
          select: {
            id: true,
            name: true,
          },
        },
        toPartner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getDailyTotals(referenceDate: Date): Promise<DailyTotals> {
    const dayStart = startOfUtcDay(referenceDate);
    const dayEnd = endOfUtcDayExclusive(referenceDate);

    const [salesAggregate, expensesAggregate] = await this.prisma.$transaction([
      this.prisma.sale.aggregate({
        where: {
          timestamp: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.expense.aggregate({
        where: {
          timestamp: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalSales = salesAggregate._sum.amount ?? new Prisma.Decimal(0);
    const totalExpenses = expensesAggregate._sum.amount ?? new Prisma.Decimal(0);

    return {
      totalSales,
      totalExpenses,
      profit: totalSales.minus(totalExpenses),
    };
  }

  async getAverageDailyExpensesBefore(
    referenceDate: Date,
    lookbackDays: number,
  ): Promise<Prisma.Decimal> {
    if (lookbackDays <= 0) {
      return new Prisma.Decimal(0);
    }

    const dayEnd = startOfUtcDay(referenceDate);
    const dayStart = new Date(dayEnd.getTime());
    dayStart.setUTCDate(dayStart.getUTCDate() - lookbackDays);

    const expensesAggregate = await this.prisma.expense.aggregate({
      where: {
        timestamp: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expensesAggregate._sum.amount ?? new Prisma.Decimal(0);

    return totalExpenses.div(lookbackDays).toDecimalPlaces(2);
  }
}
