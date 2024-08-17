import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Column } from '../models/column';
import { ApiService } from './api.service';
import { Card } from '../models/card';

@Injectable({ providedIn: 'root' })
export class CardService {
  constructor(private apiService: ApiService) {
  }

  getTransitionColumns(card: Card): Observable<{ from: Column, to: Column }|null> {
    return this.apiService
      .getBoard(card.board_id)
      .pipe(
        map(board => {
          let currentColumn = null;
          let indexOfCurrentSubColumn = -1;

          for (const column of board.columns) {
            if (column.id === card.column_id) {
              currentColumn = column;
              break;
            }

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