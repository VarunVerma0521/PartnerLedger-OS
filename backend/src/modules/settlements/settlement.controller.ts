import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SettlementService } from './settlement.service';

@Controller({
  path: 'settlements',
  version: '1',
})
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  getSettlements() {
    return this.settlementService.getSettlements();
  }
}
