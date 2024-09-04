import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';

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
