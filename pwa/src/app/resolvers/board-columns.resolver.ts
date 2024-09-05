import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CardEx } from '../models/card-ex';
import { ColumnEx } from '../models/column-ex';

export const boardColumnsResolver: ResolveFn<ColumnEx[]> = (route, state) => {
  const apiService = inject(ApiService);

  return apiService.getColumns(Number.parseInt(route.params['boardId']));
};
