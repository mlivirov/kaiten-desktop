import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { inject } from '@angular/core';
import { FileService } from '../services/file.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .getCredentials()
    .pipe(
      map(credentials => {
        return credentials.apiToken && credentials.apiEndpoint && credentials.resourcesEndpoint ? true : router.parseUrl('login');
      })
    );
};
