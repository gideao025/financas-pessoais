import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { UserProfileResponse, UserProfileUpdateRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiBaseUrl}/settings/profile`);
  }

  updateProfile(payload: UserProfileUpdateRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiBaseUrl}/settings/profile`, payload);
  }
}
