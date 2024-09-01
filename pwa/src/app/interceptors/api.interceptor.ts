import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { ApiService } from '../services/api.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiService = inject(ApiService);

  const apiUrlTemplate = 'http://server';
  if (req.url.startsWith(apiUrlTemplate)) {
    return apiService
      .getCredentials()
      .pipe(
        switchMap(creds => {
          const path = req.url.substring(apiUrlTemplate.length + 1);
          const subPath = path.substring(0, path.indexOf('/'));
          const subPathReplacements = {
            'api': creds.apiEndpoint,
            'files': creds.resourcesEndpoint
          };

          const newUrl = req.url.replace(`${apiUrlTemplate}/${subPath}`, subPathReplacements[subPath]);
          const newRequest = req.clone({
            url: newUrl,
            headers: req.headers.append('Authorization', `Bearer ${creds.apiToken}`),
          });

          return next(newRequest);
        })
      );
  } else {
    return next(req);
  }
};
