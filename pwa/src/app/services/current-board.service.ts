import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentBoardService {
  boardId?: number;
  laneId?: number;
}