import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOMAIN_EVENTS, PartnerCreatedEvent } from '../../core/events/events.constants';
import { EventBusService } from '../../core/events/event-bus.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PartnerRepository, PartnerWithWalletRecord } from './partner.repository';

type PartnerWalletResponse = {
  cash_balance: number;
  online_balance: number;
  total_balance: number;
};

export type PartnerResponse = {
  id: string;
  name: string;
  ownership_percentage: number;
  created_at: string;
  wallet: PartnerWalletResponse;
};

@Injectable()
export class PartnerService {
  constructor(
    private readonly partnerRepository: PartnerRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  async createPartner(dto: CreatePartnerDto): Promise<PartnerResponse> {
    const requestedOwnership = new Prisma.Decimal(dto.ownership_percentage);
    const currentOwnership = await this.partnerRepository.getOwnershipPercentageSum();
    const resultingOwnership = currentOwnership.plus(requestedOwnership);

    if (resultingOwnership.greaterThan(new Prisma.Decimal(100))) {
      throw new BadRequestException(
        `Total ownership cannot exceed 100%. Current ownership is ${currentOwnership.toFixed(2)}%.`,
      );
    }

    const normalizedName = dto.name.trim();
    const slug = await this.generateUniqueSlug(normalizedName);
    const createdPartner = await this.partnerRepository.createPartnerWithWallet({
      name: normalizedName,
      slug,
      ownershipPercentage: requestedOwnership,
    });

    const partnerCreatedEvent: PartnerCreatedEvent = {
      partnerId: createdPartner.id,
      name: createdPartner.name,
      ownershipPercentage: createdPartner.ownershipPercentage.toString(),
      createdAt: createdPartner.createdAt.toISOString(),
    };

    this.eventBusService.emit(DOMAIN_EVENTS.PARTNER_CREATED, partnerCreatedEvent);

    return this.toPartnerResponse(createdPartner);
  }

  async getPartners(): Promise<PartnerResponse[]> {
    const partners = await this.partnerRepository.findAllWithWallet();

    return partners.map((partner) => this.toPartnerResponse(partner));
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name);
    let candidateSlug = baseSlug;
    let suffix = 2;

    while (await this.partnerRepository.findPartnerBySlug(candidateSlug)) {
      candidateSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidateSlug;
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'partner';
  }

  private toPartnerResponse(partner: PartnerWithWalletRecord): PartnerResponse {
    return {
      id: partner.id,
      name: partner.name,
      ownership_percentage: this.decimalToNumber(partner.ownershipPercentage),
      created_at: partner.createdAt.toISOString(),
      wallet: {
        cash_balance: this.decimalToNumber(
          partner.wallet?.cashBalance ?? new Prisma.Decimal(0),
        ),
        online_balance: this.decimalToNumber(
          partner.wallet?.onlineBalance ?? new Prisma.Decimal(0),
        ),
        total_balance: this.decimalToNumber(
          partner.wallet?.totalBalance ?? new Prisma.Decimal(0),
        ),
      },
    };
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return Number(value.toString());
  }
}
