import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { DialogService } from '../services/dialog.service';

export const modalGuard: CanActivateFn = (route) => {
  const dialogService = inject(DialogService);

  if (dialogService.hasOpenDialog()) {
    dialogService.closeMostRecent();

    window.history.pushState(route.data, undefined, route.url.toString());
    return false;
  }

  return true;
};
