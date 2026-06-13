import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { DashboardSummaryResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  dashboardSummary(): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${this.apiBaseUrl}/reports/dashboard-summary`);
  }
}
