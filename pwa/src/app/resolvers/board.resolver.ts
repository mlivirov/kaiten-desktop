import { ResolveFn } from '@angular/router';
import { Board } from '../models/board';
import { inject } from '@angular/core';
import { BoardService } from '../services/board.service';

export const boardResolver: ResolveFn<Board> = (route) => {
  const service = inject(BoardService);

  return service.getBoard(Number.parseInt(route.params['boardId']));
};
