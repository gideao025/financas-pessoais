import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { AccountRequest, AccountResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  list(): Observable<AccountResponse[]> {
    return this.http.get<AccountResponse[]>(`${this.apiBaseUrl}/accounts`);
  }

  create(payload: AccountRequest): Observable<AccountResponse> {
    return this.http.post<AccountResponse>(`${this.apiBaseUrl}/accounts`, payload);
  }

  update(id: string, payload: AccountRequest): Observable<AccountResponse> {
    return this.http.put<AccountResponse>(`${this.apiBaseUrl}/accounts/${id}`, payload);
  }
}
