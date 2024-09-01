import { CanActivateChildFn, CanActivateFn, GuardResult, Router, UrlTree } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Setting } from '../models/setting';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogService } from '../services/dialogService';

export const modalGuard: CanActivateFn = (route, state) => {
  const dialogService = inject(DialogService);

  if (dialogService.hasOpenDialog()) {
    dialogService.closeMostRecent();

    window.history.pushState(route.data, undefined, route.url.toString());
    return false;
  }

  return true;
};
