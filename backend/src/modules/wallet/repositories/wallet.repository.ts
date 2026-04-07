import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type WalletWithPartnerRecord = Prisma.WalletGetPayload<{
  include: {
    partner: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  updateWalletBalances(params: {
    partnerId: string;
    cashDelta: Prisma.Decimal;
    onlineDelta: Prisma.Decimal;
    updatedAt: Date;
  }): Promise<WalletWithPartnerRecord> {
    const { partnerId, cashDelta, onlineDelta, updatedAt } = params;
    const totalDelta = cashDelta.plus(onlineDelta);

    return this.prisma.wallet.update({
      where: {
        partnerId,
      },
      data: {
        cashBalance: {
          increment: cashDelta,
        },
        onlineBalance: {
          increment: onlineDelta,
        },
        totalBalance: {
          increment: totalDelta,
        },
        lastCalculatedAt: updatedAt,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
