import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Expense, ExpenseType, PaymentSource, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import {
  DOMAIN_EVENTS,
  ExpenseCreatedEvent,
} from '../../core/events/events.constants';
import { EventBusService } from '../../core/events/event-bus.service';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import {
  CreateExpenseDto,
  CreateExpensePaymentSource,
  CreateExpenseType,
} from './dto/create-expense.dto';
import { ExpenseFilters, ExpensesRepository } from './expenses.repository';

type GetExpensesQuery = {
  paid_by?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
};

export type ExpenseResponse = {
  id: string;
  amount: number;
  category: string;
  paid_by: string;
  type: CreateExpenseType;
  payment_source: CreateExpensePaymentSource;
  description: string | null;
  timestamp: string;
};

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  async createExpense(
    dto: CreateExpenseDto,
    authenticatedUser: AuthenticatedUser,
  ): Promise<ExpenseResponse> {
    const partner = await this.expensesRepository.findPartnerById(dto.paid_by);

    if (!partner) {
      throw new NotFoundException('Paid-by partner does not exist');
    }

    if (!partner.isActive) {
      throw new BadRequestException('Paid-by partner is inactive');
    }

    const createdExpense = await this.expensesRepository.createExpense({
      amount: new Prisma.Decimal(dto.amount),
      category: dto.category.trim(),
      paidByPartnerId: dto.paid_by,
      type: this.toPrismaExpenseType(dto.type),
      paymentSource: this.toPrismaPaymentSource(dto.payment_source),
      description: dto.description?.trim() || null,
      timestamp: this.parseRequiredTimestamp(dto.timestamp),
      createdByUserId: authenticatedUser.sub,
    });

    const expenseCreatedEvent: ExpenseCreatedEvent = {
      expenseId: createdExpense.id,
      amount: createdExpense.amount.toString(),
      category: createdExpense.category,
      paidByPartnerId: createdExpense.paidByPartnerId,
      type: createdExpense.type,
      paymentSource: createdExpense.paymentSource,
      description: createdExpense.description,
      timestamp: createdExpense.timestamp.toISOString(),
      initiatedByUserId: authenticatedUser.sub,
    };

    this.eventBusService.emit(DOMAIN_EVENTS.EXPENSE_CREATED, expenseCreatedEvent);

    return this.toExpenseResponse(createdExpense);
  }

  async getExpenses(query: GetExpensesQuery): Promise<ExpenseResponse[]> {
    const filters: ExpenseFilters = {
      paidByPartnerId: this.parseOptionalPartnerId(query.paid_by),
      category: query.category?.trim() || undefined,
      dateFrom: this.parseOptionalDate(query.date_from, 'date_from'),
      dateTo: this.parseOptionalDate(query.date_to, 'date_to'),
    };

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new BadRequestException('date_from cannot be later than date_to');
    }

    const expenses = await this.expensesRepository.findExpenses(filters);

    return expenses.map((expense) => this.toExpenseResponse(expense));
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
      throw new BadRequestException('paid_by filter must be a valid UUID');
    }

    return value;
  }

  private toPrismaExpenseType(type: CreateExpenseType): ExpenseType {
    switch (type) {
      case CreateExpenseType.BUSINESS:
        return ExpenseType.BUSINESS;
      case CreateExpenseType.PERSONAL:
        return ExpenseType.PERSONAL;
      default:
        throw new BadRequestException('Unsupported expense type');
    }
  }

  private toPrismaPaymentSource(
    paymentSource: CreateExpensePaymentSource,
  ): PaymentSource {
    switch (paymentSource) {
      case CreateExpensePaymentSource.CASH:
        return PaymentSource.CASH;
      case CreateExpensePaymentSource.ONLINE:
        return PaymentSource.ONLINE;
      default:
        throw new BadRequestException('Unsupported payment source');
    }
  }

  private toApiExpenseType(type: ExpenseType): CreateExpenseType {
    switch (type) {
      case ExpenseType.BUSINESS:
        return CreateExpenseType.BUSINESS;
      case ExpenseType.PERSONAL:
        return CreateExpenseType.PERSONAL;
      default:
        throw new BadRequestException('Unsupported persisted expense type');
    }
  }

  private toApiPaymentSource(
    paymentSource: PaymentSource,
  ): CreateExpensePaymentSource {
    switch (paymentSource) {
      case PaymentSource.CASH:
        return CreateExpensePaymentSource.CASH;
      case PaymentSource.ONLINE:
        return CreateExpensePaymentSource.ONLINE;
      default:
        throw new BadRequestException('Unsupported persisted payment source');
    }
  }

  private toExpenseResponse(expense: Expense): ExpenseResponse {
    return {
      id: expense.id,
      amount: Number(expense.amount.toString()),
      category: expense.category,
      paid_by: expense.paidByPartnerId,
      type: this.toApiExpenseType(expense.type),
      payment_source: this.toApiPaymentSource(expense.paymentSource),
      description: expense.description,
      timestamp: expense.timestamp.toISOString(),
    };
  }
}
