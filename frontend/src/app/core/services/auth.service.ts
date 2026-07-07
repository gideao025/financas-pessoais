import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, tap, throwError } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { AuthResponse, LoginRequest, RegisterRequest, UserSession } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = resolveApiBaseUrl();
  private readonly storageKey = 'financas.session';

  private readonly sessionState = signal<UserSession | null>(this.readSession());
  /** Requisição de refresh em andamento, compartilhada entre chamadas concorrentes. */
  private refreshInFlight: Observable<AuthResponse> | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.sessionState()?.accessToken);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, payload)
      .pipe(tap((response) => this.storeSession(response)));
  }

  hasRefreshToken(): boolean {
    return !!this.sessionState()?.refreshToken;
  }

  /** Renova o access token usando o refresh token (rotacionado pelo backend). Compartilha uma única chamada. */
  refresh(): Observable<AuthResponse> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refreshToken = this.sessionState()?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('Sessao sem refresh token.'));
    }
    this.refreshInFlight = this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => this.storeSession(response)),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        })
      );
    return this.refreshInFlight;
  }

  logout(redirectToAuth = true): void {
    this.clearSession();
    if (redirectToAuth) {
      void this.router.navigateByUrl('/auth');
    }
  }

  clearSession(): void {
    this.sessionState.set(null);
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // localStorage may be unavailable in restricted environments.
    }
  }

  getAccessToken(): string | null {
    return this.sessionState()?.accessToken ?? null;
  }

  private storeSession(response: AuthResponse): void {
    const email = this.readJwtSubject(response.accessToken);
    const session: UserSession = {
      email,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
      tokenType: response.tokenType
    };

    this.sessionState.set(session);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    } catch {
      // Ignore storage failures and keep the in-memory session alive.
    }
  }

  private readSession(): UserSession | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  }

  private readJwtSubject(token: string): string {
    try {
      const payload = token.split('.')[1] ?? '';
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized));
      return typeof decoded.sub === 'string' ? decoded.sub : 'usuario@local';
    } catch {
      return 'usuario@local';
    }
  }
}
