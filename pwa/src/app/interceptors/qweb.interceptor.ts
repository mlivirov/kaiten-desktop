import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { from, map, of } from 'rxjs';

function base64ToBlob(val: string) {
  const separatorIndex = val.indexOf(':');
  const type = val.substring(0, separatorIndex);
  const base64 = val.substring(separatorIndex + 1);

  const data = Uint8Array.from(atob(base64).split(''), c => c.charCodeAt(0));
  return new Blob([data], { type });
}

export const qWebInterceptor: HttpInterceptorFn = (req, next) => {
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


    return next(req);
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

  const response$ = applicationProxy.httpRequest(
    req.method,
    req.url,
    parsedBody
  );

  return from(response$)
    .pipe(
      map((response: {statusCode: number, data: string}) => {
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

        return new HttpResponse({
          status: response.statusCode,
          body: parsedBody
        });
      })
    );
};
