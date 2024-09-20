import { FetchBackend, HttpBackend, HttpEvent, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { QtApplication } from './qt-application';
import { CordovaApplication } from './cordova-application';

export class HttpBackendDecorator implements HttpBackend {
  private static readonly APP_SETTINGS_PATH = 'app://settings#';
  private readonly _browserBackend: HttpBackend = new FetchBackend();

  public handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (CordovaApplication.isAvailable()) {
      return this.handleByCordova(request);
    } else if (QtApplication.isAvailable()) {
      return this.handleByQt(request);
    }

    return this.handleByBrowser(request);
  }

  private handleByLocalstorage(request: HttpRequest<string>): HttpResponse<string|void> {
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

  private handleByBrowser(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (req.url.startsWith(HttpBackendDecorator.APP_SETTINGS_PATH)) {
      return of(this.handleByLocalstorage(<HttpRequest<string>>req));
    }

    return this._browserBackend.handle(req);
  }

  private handleByQt(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return QtApplication.instance().sendHttpRequest(request);
  }

  private handleByCordova(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (request.url.startsWith(HttpBackendDecorator.APP_SETTINGS_PATH)) {
      return of(this.handleByLocalstorage(<HttpRequest<string>>request));
    }

    return CordovaApplication.instance().sendHttpRequest(request);
  }
}
