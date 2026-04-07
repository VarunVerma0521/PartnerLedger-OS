import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PartnerService } from './partner.service';

@Controller({
  path: 'partners',
  version: '1',
})
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.partnerService.createPartner(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getPartners() {
    return this.partnerService.getPartners();
  }
}
