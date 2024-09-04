import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CardEx } from '../models/card-ex';
import { EMPTY, Observable, tap } from 'rxjs';
import {
  CardTransitionConfirmationDialogComponent
} from '../dialogs/card-transition-confirmation-dialog/card-transition-confirmation-dialog.component';
import { Column } from '../models/column';
import { AlertDialogComponent } from '../dialogs/alert-dialog/alert-dialog.component';
import { Injectable } from '@angular/core';
import { SearchBoardDialogComponent } from '../dialogs/search-board-dialog/search-board-dialog.component';
import { User } from '../models/user';
import {
  LoginConfirmationDialogComponent
} from '../dialogs/login-confirmation-dialog/login-confirmation-dialog.component';
import { ApiService } from './api.service';
import { Card } from '../models/card';
import { CardGlobalSearchComponent } from '../dialogs/card-global-search/card-global-search.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private activeModals: Array<NgbModalRef> = [];

  constructor(
    private apiService: ApiService,
    private modal: NgbModal
  ) {
  }

  private removeActiveModal(modal: NgbModalRef) {
    this.activeModals.splice(this.activeModals.indexOf(modal), 1);
  }

  cardTransition(card: CardEx, from: Column, to: Column): Observable<CardEx> {
    const instance = this.modal.open(
      CardTransitionConfirmationDialogComponent
    );

    this.activeModals.push(instance);

    instance.componentInstance.card = card;
    instance.componentInstance.from = from;
    instance.componentInstance.to = to;

    const self = this;
    return instance.closed
      .pipe(
        tap({
          next() {
            self.removeActiveModal(instance);
          },
          complete() {
            self.removeActiveModal(instance);
          }
        })
      );
  }

  loginConfirmation(user: User): Observable<boolean> {
    const instance = this.modal.open(
      LoginConfirmationDialogComponent
    );
    this.activeModals.push(instance);

    instance.componentInstance.user = user;

    const self = this;
    return instance.closed
      .pipe(
        tap({
          next() {
            self.removeActiveModal(instance);
          },
          complete() {
            self.removeActiveModal(instance);
          }
        })
      );
  }

  alert(text: string): Observable<any> {
    const instance = this.modal.open(AlertDialogComponent);
    this.activeModals.push(instance);

    instance.componentInstance.text = text;

    const self = this;
    return instance.closed
      .pipe(
        tap({
          next() {
            self.removeActiveModal(instance);
          },
          complete() {
            self.removeActiveModal(instance);
          }
        })
      );
  }

  confirmation(prompt: string, title?: string): Observable<boolean> {
    const instance = this.modal.open(AlertDialogComponent);
    this.activeModals.push(instance);

    instance.componentInstance.text = prompt;
    instance.componentInstance.title = title ?? 'Confirmation';
    instance.componentInstance.cancelable = true;

    const self = this;
    return instance.closed
      .pipe(
        tap({
          next() {
            self.removeActiveModal(instance);
          },
          complete() {
            self.removeActiveModal(instance);
          }
        })
      );
  }

  searchCard(): Observable<Card> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof CardGlobalSearchComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(CardGlobalSearchComponent, {
      size: 'lg'
    });
    this.activeModals.push(instance);

    const self = this;
    return instance.closed
      .pipe(
        tap({
          next() {
            self.removeActiveModal(instance);
          },
          complete() {
            self.removeActiveModal(instance);
          }
        })
      );
  }

  searchBoard(closable: boolean = true): Observable<{spaceId: number, boardId: number}> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof SearchBoardDialogComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(SearchBoardDialogComponent, {
      beforeDismiss() {
        return closable;
      }
    });

    this.activeModals.push(instance);

    const self = this;
    return instance.closed
      .pipe(
        tap({
          next() {
            self.removeActiveModal(instance);
          },
          complete() {
            self.removeActiveModal(instance);
          }
        })
      );
  }

  hasOpenDialog(): boolean {
    return this.activeModals.length > 0;
  }

  closeMostRecent() {
    this.activeModals[this.activeModals.length - 1].close();
  }
}