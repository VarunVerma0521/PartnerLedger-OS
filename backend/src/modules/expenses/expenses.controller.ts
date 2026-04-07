import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';

@Controller({
  path: 'expenses',
  version: '1',
})
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ) {
    return this.expensesService.createExpense(dto, authenticatedUser);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getExpenses(
    @Query('paid_by') paidBy?: string,
    @Query('category') category?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.expensesService.getExpenses({
      paid_by: paidBy,
      category,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }
}
