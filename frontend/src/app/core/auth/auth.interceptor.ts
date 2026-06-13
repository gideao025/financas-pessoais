import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = authService.getAccessToken();

  const request = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout(false);
        void router.navigateByUrl('/auth');
      }

      return throwError(() => error);
    })
  );
};
