import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { GoalRequest, GoalResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  list(): Observable<GoalResponse[]> {
    return this.http.get<GoalResponse[]>(`${this.apiBaseUrl}/goals`);
  }

  create(payload: GoalRequest): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(`${this.apiBaseUrl}/goals`, payload);
  }

  update(id: string, payload: GoalRequest): Observable<GoalResponse> {
    return this.http.put<GoalResponse>(`${this.apiBaseUrl}/goals/${id}`, payload);
  }

  complete(id: string): Observable<GoalResponse> {
    return this.http.post<GoalResponse>(`${this.apiBaseUrl}/goals/${id}/complete`, {});
  }
}
