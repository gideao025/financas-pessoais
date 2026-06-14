import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { RecurrenceRequest, RecurrenceResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RecurrencesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  list(): Observable<RecurrenceResponse[]> {
    return this.http.get<RecurrenceResponse[]>(`${this.apiBaseUrl}/recurrences`);
  }

  create(payload: RecurrenceRequest): Observable<RecurrenceResponse> {
    return this.http.post<RecurrenceResponse>(`${this.apiBaseUrl}/recurrences`, payload);
  }

  update(id: string, payload: RecurrenceRequest): Observable<RecurrenceResponse> {
    return this.http.put<RecurrenceResponse>(`${this.apiBaseUrl}/recurrences/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/recurrences/${id}`);
  }
}
