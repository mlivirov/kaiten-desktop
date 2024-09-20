import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { CardEx } from '../models/card-ex';
import { CardSearchService } from '../services/card-search.service';

export const boardCardsResolver: ResolveFn<CardEx[]> = (route) => {
  const service = inject(CardSearchService);

  return service.searchCards({
    boardId: Number.parseInt(route.params['boardId'])
  });
};
