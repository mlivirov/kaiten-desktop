import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { CardEx } from '../models/card-ex';
import { ColumnEx } from '../models/column-ex';
import { BoardService } from '../services/board.service';

export const boardColumnsResolver: ResolveFn<ColumnEx[]> = (route, state) => {
  const service = inject(BoardService);

  return service.getColumns(Number.parseInt(route.params['boardId']));
};
