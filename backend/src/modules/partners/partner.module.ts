import { Module } from '@nestjs/common';
import { PartnerController } from './partner.controller';
import { PartnerRepository } from './partner.repository';
import { PartnerService } from './partner.service';

@Module({
  controllers: [PartnerController],
  providers: [PartnerService, PartnerRepository],
  exports: [PartnerService, PartnerRepository],
})
export class PartnerModule {}
