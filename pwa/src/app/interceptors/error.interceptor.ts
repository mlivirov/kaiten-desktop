import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, map, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(error);
      let message = `Server error: ${error.statusText}`;
      if (error.error && error.error['message']) {
        message = error.error['message'];
      }

      if (error.status === 401) {
        authService
          .logout()
          .pipe(
            map(() => {
              router.navigate(['login'])
            })
          )
          .subscribe();
      }

      toastService.error(message);
      return throwError(() => error);
    })
  );
};
