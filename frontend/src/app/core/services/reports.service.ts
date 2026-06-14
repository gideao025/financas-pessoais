import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { CashFlowResponse, DashboardSummaryResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  dashboardSummary(): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${this.apiBaseUrl}/reports/dashboard-summary`);
  }

  cashFlow(days: number): Observable<CashFlowResponse> {
    return this.http.get<CashFlowResponse>(`${this.apiBaseUrl}/reports/cash-flow`, {
      params: { days: String(days) }
    });
  }
}
