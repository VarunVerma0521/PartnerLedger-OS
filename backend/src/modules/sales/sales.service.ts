import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMode, Prisma, Sale } from '@prisma/client';
import { isUUID } from 'class-validator';
import { DOMAIN_EVENTS, SaleCreatedEvent } from '../../core/events/events.constants';
import { EventBusService } from '../../core/events/event-bus.service';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateSaleDto, CreateSalePaymentMode } from './dto/create-sale.dto';
import { SalesFilters, SalesRepository } from './sales.repository';

type GetSalesQuery = {
  received_by?: string;
  date_from?: string;
  date_to?: string;
};

export type SaleResponse = {
  id: string;
  amount: number;
  payment_mode: CreateSalePaymentMode;
  received_by: string;
  timestamp: string;
};

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  async createSale(
    dto: CreateSaleDto,
    authenticatedUser: AuthenticatedUser,
  ): Promise<SaleResponse> {
    const partner = await this.salesRepository.findPartnerById(dto.received_by);

    if (!partner) {
      throw new NotFoundException('Received-by partner does not exist');
    }

    if (!partner.isActive) {
      throw new BadRequestException('Received-by partner is inactive');
    }

    const createdSale = await this.salesRepository.createSale({
      amount: new Prisma.Decimal(dto.amount),
      paymentMode: this.toPrismaPaymentMode(dto.payment_mode),
      receivedByPartnerId: dto.received_by,
      timestamp: this.parseRequiredTimestamp(dto.timestamp),
      createdByUserId: authenticatedUser.sub,
    });

    const saleCreatedEvent: SaleCreatedEvent = {
      saleId: createdSale.id,
      amount: createdSale.amount.toString(),
      paymentMode: createdSale.paymentMode,
      receivedByPartnerId: createdSale.receivedByPartnerId,
      timestamp: createdSale.timestamp.toISOString(),
      initiatedByUserId: authenticatedUser.sub,
    };

    this.eventBusService.emit(DOMAIN_EVENTS.SALE_CREATED, saleCreatedEvent);

    return this.toSaleResponse(createdSale);
  }

  async getSales(query: GetSalesQuery): Promise<SaleResponse[]> {
    const filters: SalesFilters = {
      receivedByPartnerId: this.parseOptionalPartnerId(query.received_by),
      dateFrom: this.parseOptionalDate(query.date_from, 'date_from'),
      dateTo: this.parseOptionalDate(query.date_to, 'date_to'),
    };

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new BadRequestException('date_from cannot be later than date_to');
    }

    const sales = await this.salesRepository.findSales(filters);

    return sales.map((sale) => this.toSaleResponse(sale));
  }

  private parseRequiredTimestamp(timestamp: string): Date {
    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('timestamp must be a valid ISO date');
    }

    return parsedDate;
  }

  private parseOptionalDate(value: string | undefined, fieldName: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }

    return parsedDate;
  }

  private parseOptionalPartnerId(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!isUUID(value, '4')) {
      throw new BadRequestException('received_by filter must be a valid UUID');
    }

    return value;
  }

  private toPrismaPaymentMode(paymentMode: CreateSalePaymentMode): PaymentMode {
    switch (paymentMode) {
      case CreateSalePaymentMode.CASH:
        return PaymentMode.CASH;
      case CreateSalePaymentMode.ONLINE:
        return PaymentMode.ONLINE;
      default:
        throw new BadRequestException('Unsupported payment mode');
    }
  }

  private toApiPaymentMode(paymentMode: PaymentMode): CreateSalePaymentMode {
    switch (paymentMode) {
      case PaymentMode.CASH:
        return CreateSalePaymentMode.CASH;
      case PaymentMode.ONLINE:
        return CreateSalePaymentMode.ONLINE;
      default:
        throw new BadRequestException('Unsupported persisted payment mode');
    }
  }

  private toSaleResponse(sale: Sale): SaleResponse {
    return {
      id: sale.id,
      amount: Number(sale.amount.toString()),
      payment_mode: this.toApiPaymentMode(sale.paymentMode),
      received_by: sale.receivedByPartnerId,
      timestamp: sale.timestamp.toISOString(),
    };
  }
}
