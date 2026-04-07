import { Expense, ExpenseType, PaymentSource, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ExpenseFilters = {
  paidByPartnerId?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPartnerById(partnerId: string) {
    return this.prisma.partner.findUnique({
      where: {
        id: partnerId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });
  }

  createExpense(data: {
    amount: Prisma.Decimal;
    category: string;
    paidByPartnerId: string;
    type: ExpenseType;
    paymentSource: PaymentSource;
    description?: string | null;
    timestamp: Date;
    createdByUserId?: string | null;
  }): Promise<Expense> {
    return this.prisma.expense.create({
      data: {
        amount: data.amount,
        category: data.category,
        paidByPartnerId: data.paidByPartnerId,
        type: data.type,
        paymentSource: data.paymentSource,
        description: data.description ?? null,
        timestamp: data.timestamp,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
  }

  findExpenses(filters: ExpenseFilters): Promise<Expense[]> {
    const where: Prisma.ExpenseWhereInput = {
      ...(filters.paidByPartnerId
        ? {
            paidByPartnerId: filters.paidByPartnerId,
          }
        : {}),
      ...(filters.category
        ? {
            category: {
              equals: filters.category,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            timestamp: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    return this.prisma.expense.findMany({
      where,
      orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
