import { ResolveFn } from '@angular/router';
import { Board } from '../models/board';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { BoardService } from '../services/board.service';

export const boardResolver: ResolveFn<Board> = (route, state) => {
  const service = inject(BoardService);

  return service.getBoard(Number.parseInt(route.params['boardId']));
};
