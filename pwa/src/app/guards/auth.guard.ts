import { CanActivateFn, Router } from '@angular/router';
import { catchError, EmptyError, map, of, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .getCredentials()
    .pipe(
      map(() => {
        return true;
      }),
      catchError((error) => {
        if (error instanceof EmptyError) {
          return of(router.parseUrl('login'));
        }

        return throwError(error);
      }),
    );
};
