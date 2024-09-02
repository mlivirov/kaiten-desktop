import { CanActivateFn, GuardResult, Router, UrlTree } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Setting } from '../models/setting';

export const authGuard: CanActivateFn = (route, state) => {
  const apiService = inject(ApiService);
  const router = inject(Router);

  return apiService.getCredentials()
    .pipe(
      map(credentials => {
        return credentials.apiToken && credentials.apiEndpoint && credentials.resourcesEndpoint ? true : router.parseUrl('login');
      })
    );
};
