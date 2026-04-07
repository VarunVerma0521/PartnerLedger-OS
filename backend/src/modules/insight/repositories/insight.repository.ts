import { Injectable } from '@nestjs/common';
import { Insight, InsightType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type InsightCreateInput = {
  type: InsightType;
  title: string;
  description: string;
  score?: number | null;
  referenceDate: Date;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class InsightRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceInsightsForReferenceDate(params: {
    referenceDate: Date;
    managedTypes: InsightType[];
    insights: InsightCreateInput[];
  }): Promise<Insight[]> {
    const { referenceDate, managedTypes, insights } = params;

    return this.prisma.$transaction(async (transaction) => {
      await transaction.insight.deleteMany({
        where: {
          referenceDate,
          type: {
            in: managedTypes,
          },
        },
      });

      const createdInsights: Insight[] = [];

      for (const insight of insights) {
        const createdInsight = await transaction.insight.create({
          data: {
            type: insight.type,
            title: insight.title,
            description: insight.description,
            score: insight.score ?? null,
            referenceDate: insight.referenceDate,
            metadata: insight.metadata,
          },
        });

        createdInsights.push(createdInsight);
      }

      return createdInsights;
    });
  }
}
