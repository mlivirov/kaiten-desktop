import { ResolveFn } from '@angular/router';
import { Board } from '../models/board';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';

export const boardResolver: ResolveFn<Board> = (route, state) => {
  const apiService = inject(ApiService);

  return apiService.getBoard(Number.parseInt(route.params['boardId']));
};
