import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CardEx } from '../models/card-ex';

export const boardCardsResolver: ResolveFn<CardEx[]> = (route, state) => {
  const apiService = inject(ApiService);

  return apiService.getCards(Number.parseInt(route.params['boardId']));
};
