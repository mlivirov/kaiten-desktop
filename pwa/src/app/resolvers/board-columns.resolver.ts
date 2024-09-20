import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ColumnEx } from '../models/column-ex';
import { BoardService } from '../services/board.service';

export const boardColumnsResolver: ResolveFn<ColumnEx[]> = (route) => {
  const service = inject(BoardService);

  return service.getColumns(Number.parseInt(route.params['boardId']));
};
