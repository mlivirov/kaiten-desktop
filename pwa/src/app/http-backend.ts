import {
  FetchBackend,
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { from, map, observable, Observable, of } from 'rxjs';

function base64ToBlob(val: string) {
  const separatorIndex = val.indexOf(':');
  const type = val.substring(0, separatorIndex);
  const base64 = val.substring(separatorIndex + 1);

  const data = Uint8Array.from(atob(base64).split(''), c => c.charCodeAt(0));
  return new Blob([data], { type });
}

export class AppHttpBackend implements HttpBackend {
  browserBackend: HttpBackend = new FetchBackend();

  constructor() {
  }

  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (!window['qt']) {
      const appSettingsPath = 'app://settings#';
      if (req.url.startsWith(appSettingsPath)) {
        const settingName = req.url.substring(appSettingsPath.length);

        if (req.method === 'POST') {
          localStorage.setItem(settingName, req.body as string);

          return of(new HttpResponse<string>({
            status: 200,
            body: req.body as string,
          }));
        } else if (req.method === 'GET') {
          return of(new HttpResponse<string>({
            status: 200,
            body: localStorage.getItem(settingName)
          }));
        }
      }

      return this.browserBackend.handle(req);
    }

    const applicationProxy = window['ApplicationProxy'] as {
      httpRequest(method: string, url: string, data?: string): Promise<{ statusCode: number, data: string }>
    };

    let parsedBody: string;

    switch (typeof req.body) {
      case 'object':
        if (req.body === null) {
          parsedBody = null;
        } if (req.body instanceof FormData) {
        alert('not supported');
      } else {
        parsedBody = JSON.stringify(req.body);
      }
        break;
      case 'undefined':
        parsedBody = null;
        break;
      default:
        parsedBody = req.body as string;
    }

    return new Observable(subscriber => {
      applicationProxy.httpRequest(
        req.method,
        req.url,
        parsedBody
      ).then((response: { statusCode: number, data: string }) => {
        if (response.statusCode !== 200) {
          subscriber.error(new HttpErrorResponse({
            status: response.statusCode,
            url: req.url,
            statusText: response.data,
            headers: new HttpHeaders({}),
            error: 'custom'
          }));
          subscriber.complete();
        }

        let parsedBody: unknown;

        switch (req.responseType) {
          case 'json':
            parsedBody = response.data ? JSON.parse(response.data) : null;
            break;
          case 'blob':
            parsedBody = response.data ? base64ToBlob(response.data) : null;
            break;
          default:
            parsedBody = response.data;
            break;
        }

        subscriber.next(new HttpResponse({
          status: response.statusCode,
          body: parsedBody
        }));

        subscriber.complete();
      });
    });
  }
}