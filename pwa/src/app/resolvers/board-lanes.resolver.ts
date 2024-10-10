import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { BoardService } from '../services/board.service';
import { LaneEx } from '../models/lane';

export const boardLanesResolver: ResolveFn<LaneEx[]> = (route) => {
  const service = inject(BoardService);

  return service.getLanes(Number.parseInt(route.params['boardId']));
};
