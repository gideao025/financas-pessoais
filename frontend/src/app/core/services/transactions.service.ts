import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { TransactionRequest, TransactionResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  /** Lista transações; opcionalmente filtra por intervalo de datas no servidor (ISO yyyy-MM-dd). */
  list(range?: { from?: string; to?: string }): Observable<TransactionResponse[]> {
    let params = new HttpParams();
    if (range?.from) {
      params = params.set('from', range.from);
    }
    if (range?.to) {
      params = params.set('to', range.to);
    }
    return this.http.get<TransactionResponse[]>(`${this.apiBaseUrl}/transactions`, { params });
  }

  create(payload: TransactionRequest): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(`${this.apiBaseUrl}/transactions`, payload);
  }

  update(id: string, payload: TransactionRequest): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(`${this.apiBaseUrl}/transactions/${id}`, payload);
  }

  /** Registra pagamento (total ou parcial). Sem `amount`, quita o restante. */
  pay(id: string, amount?: number): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      `${this.apiBaseUrl}/transactions/${id}/pay`,
      amount != null ? { amount } : {}
    );
  }

  /** Gera (sob demanda) as contas fixas do mês a partir das recorrências. */
  generateRecurrences(month?: string): Observable<TransactionResponse[]> {
    return this.http.post<TransactionResponse[]>(
      `${this.apiBaseUrl}/recurrences/generate`,
      {},
      { params: month ? { month } : {} }
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/transactions/${id}`);
  }
}
