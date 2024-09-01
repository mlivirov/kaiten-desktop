import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, retry, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  return new Observable(subscriber => {
    next(req)
      .pipe(
        retry({
          delay: (err) => {
            if (err instanceof HttpErrorResponse && err.status === 429) {
              return timer(1000);
            }

            throw err;
          }
        }),
      )
      .subscribe({
        next(data) {
          subscriber.next(data);
        },
        error(err) {
          if (err instanceof HttpErrorResponse && err.status === 429) {
            return;
          }

          subscriber.error(err);
        },
        complete() { subscriber.complete(); }
      });
  });
};
