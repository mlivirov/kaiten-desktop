import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { FileService } from '../services/file.service';
import { CardEx } from '../models/card-ex';
import { BoardService } from '../services/board.service';
import { CardSearchService } from '../services/card-search.service';

export const boardCardsResolver: ResolveFn<CardEx[]> = (route, state) => {
  const service = inject(CardSearchService);

  return service.searchCards({
    boardId: Number.parseInt(route.params['boardId'])
  });
};
