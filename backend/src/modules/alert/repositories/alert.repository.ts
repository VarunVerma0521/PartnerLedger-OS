import { Injectable } from '@nestjs/common';
import { Alert, AlertSeverity, AlertType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type AlertCreateInput = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  referenceDate: Date;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceAlertsForReferenceDate(params: {
    referenceDate: Date;
    managedTypes: AlertType[];
    alerts: AlertCreateInput[];
  }): Promise<Alert[]> {
    const { referenceDate, managedTypes, alerts } = params;

    return this.prisma.$transaction(async (transaction) => {
      await transaction.alert.deleteMany({
        where: {
          referenceDate,
          type: {
            in: managedTypes,
          },
        },
      });

      const createdAlerts: Alert[] = [];

      for (const alert of alerts) {
        const createdAlert = await transaction.alert.create({
          data: {
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            referenceDate: alert.referenceDate,
            metadata: alert.metadata,
          },
        });

        createdAlerts.push(createdAlert);
      }

      return createdAlerts;
    });
  }
}
