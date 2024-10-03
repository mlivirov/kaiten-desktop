import { Subject } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChangesNotificationService {
  public cardUpdated$ = new Subject<CardEx>();
  public cardCreated$ = new Subject<CardEx>();

  public notifyCardUpdated(card: CardEx): void {
    this.cardUpdated$.next(card);
  }

  public notifyCardCreated(card: CardEx): void {
    this.cardCreated$.next(card);
  }
}