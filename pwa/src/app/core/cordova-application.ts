import { EMPTY, Observable, of, Subject } from 'rxjs';
import { HttpErrorResponse, HttpEvent, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

export class CordovaApplication {
  private static _instance: CordovaApplication;
  private readonly _readySubject: Subject<CordovaApplication> = new Subject();

  constructor() {
    setTimeout(() => {
      document.addEventListener('deviceready', this.initialize.bind(this), false);
    }, 1000);
  }

  static instance(): CordovaApplication {
    return CordovaApplication._instance;
  }

  static isAvailable(): boolean {
    return window['build-type'] === 'cordova';
  }

  static create(): Observable<CordovaApplication> {
    if (!CordovaApplication.isAvailable()) {
      return EMPTY;
    }

    if (CordovaApplication._instance) {
      return of(CordovaApplication._instance);
    }

    const applicationProxy = new CordovaApplication();
    CordovaApplication._instance = applicationProxy;

    return applicationProxy._readySubject;
  }

  initialize(): void {
    this._readySubject.next(this);
    this._readySubject.complete();
  }

  public sendHttpRequest(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    return new Observable(subscriber => {
      const http = window['cordova']['plugin']['http'];

      let serializer = 'json';

      if (request.body instanceof FormData) {
        serializer = 'multipart';
      } else if (typeof request.body === 'string') {
        serializer = 'utf8';
      } else {
        serializer = 'json';
      }

      request.serializeBody()

      http.sendRequest(request.url, {
        method: request.method,
        data: request.body,
        responseType: request.responseType,
        headers: request.headers.keys().reduce((agg, item) => ({ ...agg, [item]: request.headers.get(item) }), {}),
        serializer: serializer,
      }, response => {
        subscriber.next(new HttpResponse({
          status: response.status,
          body: response.data,
          url: response.url,
          headers: new HttpHeaders(response.headers),
        }));

        subscriber.complete();
      }, error => {
        subscriber.error(new HttpErrorResponse({
          status: error.status,
          statusText: error.error,
          url: error.url,
          error: error,
          headers: new HttpHeaders(error.headers)
        }));

        subscriber.complete();
      });
    });
  }
}