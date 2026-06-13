import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { CardRequest, CardResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  list(): Observable<CardResponse[]> {
    return this.http.get<CardResponse[]>(`${this.apiBaseUrl}/cards`);
  }

  create(payload: CardRequest): Observable<CardResponse> {
    return this.http.post<CardResponse>(`${this.apiBaseUrl}/cards`, payload);
  }

  toggleBlock(id: string): Observable<CardResponse> {
    return this.http.post<CardResponse>(`${this.apiBaseUrl}/cards/${id}/toggle-block`, {});
  }
}
