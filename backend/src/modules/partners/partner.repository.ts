import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type PartnerWithWalletRecord = Prisma.PartnerGetPayload<{
  include: { wallet: true };
}>;

@Injectable()
export class PartnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnershipPercentageSum(): Promise<Prisma.Decimal> {
    const aggregateResult = await this.prisma.partner.aggregate({
      _sum: {
        ownershipPercentage: true,
      },
    });

    return aggregateResult._sum.ownershipPercentage ?? new Prisma.Decimal(0);
  }

  findPartnerBySlug(slug: string) {
    return this.prisma.partner.findUnique({
      where: { slug },
    });
  }

  async createPartnerWithWallet(data: {
    name: string;
    slug: string;
    ownershipPercentage: Prisma.Decimal;
  }): Promise<PartnerWithWalletRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const partner = await transaction.partner.create({
        data: {
          name: data.name,
          slug: data.slug,
          ownershipPercentage: data.ownershipPercentage,
        },
      });

      await transaction.wallet.create({
        data: {
          partnerId: partner.id,
          cashBalance: new Prisma.Decimal(0),
          onlineBalance: new Prisma.Decimal(0),
          totalBalance: new Prisma.Decimal(0),
        },
      });

      return transaction.partner.findUniqueOrThrow({
        where: {
          id: partner.id,
        },
        include: {
          wallet: true,
        },
      });
    });
  }

  findAllWithWallet(): Promise<PartnerWithWalletRecord[]> {
    return this.prisma.partner.findMany({
      include: {
        wallet: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
