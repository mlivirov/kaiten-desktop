import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentBoardService {
  public boardId?: number;
  public laneId?: number;
}
