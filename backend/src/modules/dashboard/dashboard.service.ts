import { Injectable } from '@nestjs/common';
import { DashboardRepository, DashboardResponse } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  getDashboard(): Promise<DashboardResponse> {
    return this.dashboardRepository.getDashboardView(5);
  }
}
