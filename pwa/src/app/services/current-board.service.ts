import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentBoardService {
  public lastViewedBoardId?: number;
  public boardId?: number;
  public laneId?: number;
}
