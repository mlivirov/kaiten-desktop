import { Injectable } from '@angular/core';
import { ServerCardEditorService } from './implementations/server-card-editor.service';
import { Board } from '../models/board';
import { Lane } from '../models/lane';
import { Column } from '../models/column';
import { CardActivity } from '../models/card-activity';
import { CardState } from '../models/card-state';
import { getCardState } from '../functions/get-card-state';

export interface ThroughputReportEntry {
  board?: Board;
  lane?: Lane;
  column?: Column;
  subcolumn?: Column,
  timeInColumn: number;
  startedAt: Date;
  type: CardState;
}

export interface ThroughputReport {
  entries: ThroughputReportEntry[];
  timeOnBoard: number;
  timeToDone: number;
  timeInProgress: number;
  timeNotInProgress: number;
}

@Injectable({ providedIn: 'root' })
export class ThroughputReportService {
  public constructor(private cardEditorService: ServerCardEditorService) {
  }

  public getCardReport(activities?: CardActivity[]): ThroughputReport {
    const transitions = activities
      .map(t => {
        t.created = new Date(t.created);
        return t;
      })
      .filter(t => ['card_move', 'card_add', 'card_archive'].includes(t.action))
      .sort((a, b) => a.created.getTime() - b.created.getTime());

    if (transitions[transitions.length - 1].action !== 'card_archive') {
      transitions.push({
        created: new Date()
      } as unknown as CardActivity);
    }

    const entries = transitions
      .map((val, index, arr) => {
        if (index === 0) {
          return null;
        }

        const prevVal = arr[index - 1];
        const timeInColumn = val.created.getTime() - prevVal.created.getTime();

        return <ThroughputReportEntry>{
          timeInColumn,
          board: prevVal.board,
          lane: prevVal.lane,
          column: prevVal.column,
          subcolumn: prevVal.subcolumn,
          type: getCardState(prevVal.column, prevVal.subcolumn),
          startedAt: prevVal.created
        };
      })
      .filter(t => !!t);

    return <ThroughputReport>{
      entries: entries,
      timeOnBoard: entries.reduce((acc, t) => acc + t.timeInColumn, 0),
      timeToDone: entries.reduce((acc, t) => t.type !== CardState.Done ? acc + t.timeInColumn : acc, 0),
      timeInProgress: entries.reduce((acc, t) => t.type === CardState.InProgress ? acc + t.timeInColumn : acc, 0),
      timeNotInProgress: entries.reduce((acc, t) => t.type !== CardState.InProgress ? acc + t.timeInColumn : acc, 0)
    };
  }
}
