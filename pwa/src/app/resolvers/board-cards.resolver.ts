import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { CardEx } from '../models/card-ex';
import { CardSearchService } from '../services/card-search.service';
import { BoardBase } from '../models/board';

export const boardCardsResolver: ResolveFn<CardEx[]> = (route) => {
  const service = inject(CardSearchService);

  return service.searchCards({
    board: <BoardBase>{ id: Number.parseInt(route.params['boardId']) }
  });
};
