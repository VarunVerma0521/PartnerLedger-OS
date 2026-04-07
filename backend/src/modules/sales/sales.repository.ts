import { Injectable } from '@nestjs/common';
import { PaymentMode, Prisma, Sale } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SalesFilters = {
  receivedByPartnerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

@Injectable()
export class SalesRepository {
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

  createSale(data: {
    amount: Prisma.Decimal;
    paymentMode: PaymentMode;
    receivedByPartnerId: string;
    timestamp: Date;
    createdByUserId?: string | null;
  }): Promise<Sale> {
    return this.prisma.sale.create({
      data: {
        amount: data.amount,
        paymentMode: data.paymentMode,
        receivedByPartnerId: data.receivedByPartnerId,
        timestamp: data.timestamp,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
  }

  findSales(filters: SalesFilters): Promise<Sale[]> {
    const where: Prisma.SaleWhereInput = {
      ...(filters.receivedByPartnerId
        ? {
            receivedByPartnerId: filters.receivedByPartnerId,
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

    return this.prisma.sale.findMany({
      where,
      orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
