import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { map, Observable, switchMap } from 'rxjs';
import { Setting } from '../models/setting';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  constructor(private apiService: ApiService) {
  }
  
  getCustomColumns(boardId: number): Observable<number[][]> {
    return this.apiService
      .getSetting(Setting.CustomColumns)
      .pipe(
        map(data => {
          const parsed = data ? JSON.parse(data) as { [key: string]: number[][] } : {};
          return parsed[boardId] ?? [];
        })
      )
  }

  setCustomColumns(boardId: number, columns: number[][]): Observable<void> {
    return this.apiService
      .getSetting(Setting.CustomColumns)
      .pipe(
        switchMap(data => {
          const parsed = data ? JSON.parse(data) as { [key: string]: number[][] } : {};
          parsed[boardId] = columns;

          return this.apiService.setSetting(Setting.CustomColumns, JSON.stringify(parsed));
        })
      )
  }
}
