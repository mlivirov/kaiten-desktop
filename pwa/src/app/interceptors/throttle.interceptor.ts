import {
  HttpEvent, HttpHandlerFn,
  HttpInterceptorFn, HttpRequest,
} from '@angular/common/http';
import {
  BehaviorSubject,
  filter,
  interval, map,
  Observable,
  switchMap,
  take,
} from 'rxjs';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
class ThrottleService {
  queue = new Array<{req: HttpRequest<any>, next: HttpHandlerFn}>();
  active$ = new BehaviorSubject<{req: HttpRequest<any>, next: HttpHandlerFn}>(null);
  interval$ = interval(1000/4);

  constructor() {
    this.interval$
      .pipe(
        filter(t => this.queue.length > 0),
        map(t => this.queue.shift())
      )
      .subscribe((item) => {
        this.active$.next(item);
      });
  }

  throttle(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    this.queue.push({req, next});

    return this.active$
      .pipe(
        filter(x => x?.req === req),
        take(1),
        switchMap((x: {req: HttpRequest<any>, next: HttpHandlerFn}) => x.next(x.req)),
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
