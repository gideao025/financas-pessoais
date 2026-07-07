import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const isAuthCall = (req: HttpRequest<unknown>): boolean =>
  req.url.includes('/auth/login') ||
  req.url.includes('/auth/register') ||
  req.url.includes('/auth/refresh');

const withToken = (req: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = authService.getAccessToken();

  const request = accessToken && !isAuthCall(req) ? withToken(req, accessToken) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const expirou =
        error instanceof HttpErrorResponse && error.status === 401 && !isAuthCall(req);

      // Token expirado: tenta renovar via refresh e repete a requisição uma única vez.
      if (expirou && authService.hasRefreshToken()) {
        return authService.refresh().pipe(
          switchMap((response) => next(withToken(req, response.accessToken))),
          catchError((refreshError: unknown) => {
            authService.logout(false);
            void router.navigateByUrl('/auth');
            return throwError(() => refreshError);
          })
        );
      }

      if (expirou) {
        authService.logout(false);
        void router.navigateByUrl('/auth');
      }

      return throwError(() => error);
    })
  );
};
