import {
  FetchBackend,
  HttpBackend, HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { delay, filter, finalize, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { QtApplication, ResponseData } from './qt-application';

function base64ToBlob(val: string) {
  const separatorIndex = val.indexOf(':');
  const type = val.substring(0, separatorIndex);
  const base64 = val.substring(separatorIndex + 1);

  const data = Uint8Array.from(atob(base64).split(''), c => c.charCodeAt(0));
  return new Blob([data], { type });
}

export class HttpBackendDecorator implements HttpBackend {
  static readonly APP_SETTINGS_PATH = 'app://settings#';
  private readonly _browserBackend: HttpBackend = new FetchBackend();


  handle(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    return this.handleInner(request);
  }

  private useLocalstorage(request: HttpRequest<string>): HttpResponse<string|void> {
    const settingName = request.url.substring(HttpBackendDecorator.APP_SETTINGS_PATH.length);

    if (request.method === 'GET') {
      return new HttpResponse<string>({
        status: 200,
        body: localStorage.getItem(settingName),
        headers: new HttpHeaders()
      });
    } else if (request.method === 'DELETE') {
      localStorage.removeItem(settingName);

      return new HttpResponse({
        status: 200,
        headers: new HttpHeaders()
      });
    } else {
      localStorage.setItem(settingName, request.body as string);

      return new HttpResponse<string>({
        status: 200,
        body: request.body as string,
        headers: new HttpHeaders()
      });
    }
  }

  private handleInBrowser(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (req.url.startsWith(HttpBackendDecorator.APP_SETTINGS_PATH)) {
      return of(this.useLocalstorage(req));
    }

    return this._browserBackend.handle(req);
  }

  private parseQtResponseBody(request: HttpRequest<any>, data?: string) {
    switch (request.responseType) {
      case 'json':
        return data ? JSON.parse(data) : null;
      case 'blob':
        return data ? base64ToBlob(data) : null;
      default:
        return data;
    }
  }

  private processQtApplicationResponse(request: HttpRequest<any>, response: ResponseData): HttpResponse<any> {
    if (response.statusCode !== 200) {
      return new HttpResponse({
        status: response.statusCode,
        statusText: response.data,
        url: request.url,
        headers: new HttpHeaders(response.headers),
      })
    }

    const parsedBody = this.parseQtResponseBody(request, response.data);
    return new HttpResponse({
      status: response.statusCode,
      body: parsedBody,
      url: request.url,
      headers: new HttpHeaders(response.headers),
    });
  }

  private handleInner(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (!QtApplication.isAvailable()) {
      return this.handleInBrowser(request);
    }

    const serializedRequestBody = request.serializeBody();
    if (!(serializedRequestBody === null || typeof serializedRequestBody === 'string')) {
      throw('not supported body type');
    }

    return new Observable(subscriber => {
      QtApplication
        .instance()
        .httpRequest(
          request.method,
          request.url,
          serializedRequestBody as string
        )
        .then(response => {
          try {
            const httpResponse = this.processQtApplicationResponse(request, response);

            if (httpResponse.status !== 200) {
              subscriber.error(new HttpErrorResponse(httpResponse));
            } else {
              subscriber.next(httpResponse);
            }
          } catch (e) {
            subscriber.error(new HttpErrorResponse({
              status: 0,
              statusText: 'Middleware error',
              error: e
            }));
          }

          subscriber.complete();
        });
    });
  }
}