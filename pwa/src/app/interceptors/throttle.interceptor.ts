import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, } from '@angular/common/http';
import { BehaviorSubject, filter, interval, map, Observable, switchMap, take, } from 'rxjs';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
class ThrottleService {
  private queue = new Array<{req: HttpRequest<unknown>, next: HttpHandlerFn}>();
  private active$ = new BehaviorSubject<{req: HttpRequest<unknown>, next: HttpHandlerFn}>(null);
  private interval$ = interval(1000/4);

  public constructor() {
    this.interval$
      .pipe(
        filter(() => this.queue.length > 0),
        map(() => this.queue.shift())
      )
      .subscribe((item) => {
        this.active$.next(item);
      });
  }

  public throttle(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    this.queue.push({req, next});

    return this.active$
      .pipe(
        filter(x => x?.req === req),
        take(1),
        switchMap((x: {req: HttpRequest<unknown>, next: HttpHandlerFn}) => x.next(x.req)),
      );
  }
}

export const throttleInterceptor: HttpInterceptorFn = (req, next) => {
  const throttleService = inject(ThrottleService);
  if (req.url.startsWith('http://server/api/')) {
    return throttleService.throttle(req, next);
  } else {
    return next(req);
  }
};
