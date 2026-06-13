import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { TransactionRequest, TransactionResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  list(): Observable<TransactionResponse[]> {
    return this.http.get<TransactionResponse[]>(`${this.apiBaseUrl}/transactions`);
  }

  create(payload: TransactionRequest): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(`${this.apiBaseUrl}/transactions`, payload);
  }
}
