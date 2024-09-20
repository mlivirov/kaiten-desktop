import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Lane } from '../models/lane';
import { Database, getManyWithCache, getSingleWithCache } from './db';
import { Board } from '../models/board';
import { ColumnEx } from '../models/column-ex';
import { Space } from '../models/space';
import { HttpClient } from '@angular/common/http';
import { Setting } from '../models/setting';
import { SettingService } from './setting.service';
import { CardType } from '../models/card-type';

@Injectable({ providedIn: 'root' })
export class BoardService {
  public constructor(private httpClient: HttpClient, private settingsService: SettingService) {
  }

  public getCustomColumns(boardId: number): Observable<number[][]> {
    return this.settingsService
      .getSetting(Setting.CustomColumns)
      .pipe(
        map(data => {
          const parsed = data ? JSON.parse(data) as { [key: string]: number[][] } : {};
          return parsed[boardId] ?? [];
        })
      );
  }

  public setCustomColumns(boardId: number, columns: number[][]): Observable<void> {
    return this.settingsService
      .getSetting(Setting.CustomColumns)
      .pipe(
        switchMap(data => {
          const parsed = data ? JSON.parse(data) as { [key: string]: number[][] } : {};
          parsed[boardId] = columns;

          return this.settingsService.setSetting(Setting.CustomColumns, JSON.stringify(parsed));
        })
      );
  }

  public getLanes(boardId: number): Observable<Lane[]> {
    const lanes$ = this.httpClient.get<Lane[]>(`http://server/api/latest/boards/${boardId}/lanes`);
    return getManyWithCache(lanes$, Database.lanes, t => t.where({ board_id: boardId }));
  }

  public getBoard(boardId: number): Observable<Board> {
    const board$ = this.httpClient.get<Board>(`http://server/api/latest/boards/${boardId}`);
    return getSingleWithCache(board$, Database.boards, boardId);
  }

  public getColumns(boardId: number): Observable<ColumnEx[]> {
    const request$ = this.httpClient.get<ColumnEx[]>(`http://server/api/latest/boards/${boardId}/columns`);
    return getManyWithCache(request$, Database.columns, t => t.where({ board_id: boardId }));
  }

  public getSpaces(): Observable<Space[]> {
    const request$ = this.httpClient.get<Space[]>('http://server/api/latest/spaces');
    return getManyWithCache(request$, Database.spaces);
  }

  public getCardTypes(): Observable<CardType[]> {
    const request$ = this.httpClient.get<CardType[]>('http://server/api/latest/card-types');
    return getManyWithCache(request$, Database.cardTypes);
  }
}
