import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimalToNumber } from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';

export type DashboardSnapshot = {
  total_cash: number;
  total_online: number;
  total_sales: number;
  total_expenses: number;
  profit: number;
  partner_balances: Array<{
    partner_id: string;
    partner_name: string;
    ownership_percentage: number;
    cash_balance: number;
    online_balance: number;
    total_balance: number;
  }>;
  generated_at: string;
};

export type DashboardResponse = {
  total_cash: number;
  total_online: number;
  total_sales: number;
  total_expenses: number;
  profit: number;
  partners: Array<{
    id: string;
    name: string;
    wallet_balance: number;
    ownership_percentage: number;
  }>;
  recent_transactions: {
    sales: Array<{
      id: string;
      amount: number;
      payment_mode: 'cash' | 'online';
      received_by: string;
      timestamp: string;
    }>;
    expenses: Array<{
      id: string;
      amount: number;
      category: string;
      paid_by: string;
      type: 'business' | 'personal';
      payment_source: 'cash' | 'online';
      description: string | null;
      timestamp: string;
    }>;
  };
};

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    const [walletAggregate, salesAggregate, expensesAggregate, partners] =
      await this.prisma.$transaction([
        this.prisma.wallet.aggregate({
          _sum: {
            cashBalance: true,
            onlineBalance: true,
          },
        }),
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

    const totalSales = salesAggregate._sum.amount ?? new Prisma.Decimal(0);
    const totalExpenses = expensesAggregate._sum.amount ?? new Prisma.Decimal(0);

    return {
      total_cash: decimalToNumber(walletAggregate._sum.cashBalance),
      total_online: decimalToNumber(walletAggregate._sum.onlineBalance),
      total_sales: decimalToNumber(totalSales),
      total_expenses: decimalToNumber(totalExpenses),
      profit: decimalToNumber(totalSales.minus(totalExpenses)),
      partner_balances: partners.map((partner) => ({
        partner_id: partner.id,
        partner_name: partner.name,
        ownership_percentage: decimalToNumber(partner.ownershipPercentage),
        cash_balance: decimalToNumber(partner.wallet?.cashBalance),
        online_balance: decimalToNumber(partner.wallet?.onlineBalance),
        total_balance: decimalToNumber(partner.wallet?.totalBalance),
      })),
      generated_at: new Date().toISOString(),
    };
  }

  async getDashboardView(recentLimit = 5): Promise<DashboardResponse> {
    const [
      walletAggregate,
      salesAggregate,
      expensesAggregate,
      partners,
      recentSales,
      recentExpenses,
    ] = await this.prisma.$transaction([
      this.prisma.wallet.aggregate({
        _sum: {
          cashBalance: true,
          onlineBalance: true,
        },
      }),
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
      this.prisma.sale.findMany({
        take: recentLimit,
        orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.expense.findMany({
        take: recentLimit,
        orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const totalSales = salesAggregate._sum.amount ?? new Prisma.Decimal(0);
    const totalExpenses = expensesAggregate._sum.amount ?? new Prisma.Decimal(0);

    return {
      total_cash: decimalToNumber(walletAggregate._sum.cashBalance),
      total_online: decimalToNumber(walletAggregate._sum.onlineBalance),
      total_sales: decimalToNumber(totalSales),
      total_expenses: decimalToNumber(totalExpenses),
      profit: decimalToNumber(totalSales.minus(totalExpenses)),
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        wallet_balance: decimalToNumber(partner.wallet?.totalBalance),
        ownership_percentage: decimalToNumber(partner.ownershipPercentage),
      })),
      recent_transactions: {
        sales: recentSales.map((sale) => ({
          id: sale.id,
          amount: decimalToNumber(sale.amount),
          payment_mode: sale.paymentMode === 'CASH' ? 'cash' : 'online',
          received_by: sale.receivedByPartnerId,
          timestamp: sale.timestamp.toISOString(),
        })),
        expenses: recentExpenses.map((expense) => ({
          id: expense.id,
          amount: decimalToNumber(expense.amount),
          category: expense.category,
          paid_by: expense.paidByPartnerId,
          type: expense.type === 'BUSINESS' ? 'business' : 'personal',
          payment_source:
            expense.paymentSource === 'CASH' ? 'cash' : 'online',
          description: expense.description,
          timestamp: expense.timestamp.toISOString(),
        })),
      },
    };
  }
}
