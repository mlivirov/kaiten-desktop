import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Column } from '../models/column';
import { FileService } from './file.service';
import { Card } from '../models/card';
import { BoardService } from './board.service';

@Injectable({ providedIn: 'root' })
export class CardTransitionService {
  constructor(private boardsService: BoardService) {
  }

  getTransitionColumns(card: Card): Observable<{ from: Column, to: Column }|null> {
    return this.boardsService
      .getBoard(card.board_id)
      .pipe(
        map(board => {
          let currentColumn = null;
          let indexOfCurrentSubColumn = -1;

          board.columns.sort((a, b) => a.sort_order - b.sort_order);
          for (const column of board.columns) {
            if (column.id === card.column_id) {
              currentColumn = column;
              break;
            }

            column.subcolumns?.sort((a, b) => a.sort_order - b.sort_order);
            indexOfCurrentSubColumn = (column?.subcolumns || []).findIndex(c => c.id === card.column_id);
            if (indexOfCurrentSubColumn >= 0) {
              currentColumn = column;
              break;
            }
          }

          const indexOfCurrentColumn = board.columns.indexOf(currentColumn);
          let nextSubcolumnIndex = -1;
          let prevColumn = null;

          let nextColumnIndex = -1;
          if (indexOfCurrentSubColumn === -1) {
            nextColumnIndex = indexOfCurrentColumn + 1;
            prevColumn = currentColumn;
          } else if (currentColumn.subcolumns.length - 1 === indexOfCurrentSubColumn) {
            nextColumnIndex = indexOfCurrentColumn + 1;
            prevColumn = currentColumn.subcolumns[indexOfCurrentSubColumn];
          } else {
            nextColumnIndex = indexOfCurrentColumn;
            nextSubcolumnIndex = indexOfCurrentSubColumn + 1;
            prevColumn = currentColumn.subcolumns[indexOfCurrentSubColumn];
          }

          if (nextColumnIndex === board.columns.length) {
            return null;
          }

          const nextColumn = board.columns[nextColumnIndex];
          if (nextColumn.subcolumns && nextSubcolumnIndex === -1) {
            nextSubcolumnIndex = 0;
          }

          const targetColumn = nextSubcolumnIndex === -1 ? nextColumn : nextColumn.subcolumns[nextSubcolumnIndex];

          return { from: prevColumn, to: targetColumn };
        })
      );
  }
}