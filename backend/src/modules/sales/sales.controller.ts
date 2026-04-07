import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller({
  path: 'sales',
  version: '1',
})
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  createSale(
    @Body() dto: CreateSaleDto,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ) {
    return this.salesService.createSale(dto, authenticatedUser);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getSales(
    @Query('received_by') receivedBy?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.salesService.getSales({
      received_by: receivedBy,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }
}
