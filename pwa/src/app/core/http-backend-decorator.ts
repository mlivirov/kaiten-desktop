import {
  FetchBackend,
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
  readonly browserBackend: HttpBackend = new FetchBackend();

  private useLocalstorage(request: HttpRequest<string>): HttpResponse<string|void> {
    const settingName = request.url.substring(HttpBackendDecorator.APP_SETTINGS_PATH.length);

    if (request.method === 'GET') {
      return new HttpResponse<string>({
        status: 200,
        body: localStorage.getItem(settingName)
      });
    } else if (request.method === 'DELETE') {
      localStorage.removeItem(settingName);

      return new HttpResponse({
        status: 200,
      });
    } else {
      localStorage.setItem(settingName, request.body as string);

      return new HttpResponse<string>({
        status: 200,
        body: request.body as string,
      });
    }
  }

  private handleInBrowser(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (req.url.startsWith(HttpBackendDecorator.APP_SETTINGS_PATH)) {
      return of(this.useLocalstorage(req));
    }

    return this.browserBackend.handle(req);
  }

  parseQtResponseBody(request: HttpRequest<any>, data?: string) {
    switch (request.responseType) {
      case 'json':
        return data ? JSON.parse(data) : null;
      case 'blob':
        return data ? base64ToBlob(data) : null;
      default:
        return data;
    }
  }

  processQtApplicationResponse(request: HttpRequest<any>, response: ResponseData): HttpResponse<any> {
    if (response.statusCode !== 200) {
      return new HttpResponse({
        status: response.statusCode,
        statusText: response.data,
        url: request.url,
      })
    }

    const parsedBody = this.parseQtResponseBody(request, response.data);

    return new HttpResponse({
      status: response.statusCode,
      body: parsedBody,
      url: request.url,
    });
  }

  handle(request: HttpRequest<any>): Observable<HttpEvent<any>> {
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