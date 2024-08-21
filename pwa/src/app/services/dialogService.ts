import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CardEx } from '../models/card-ex';
import { EMPTY, finalize, Observable, of } from 'rxjs';
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
import { LoadingDialogComponent } from '../dialogs/loading-dialog/loading-dialog.component';
import { Card } from '../models/card';
import { CardGlobalSearchComponent } from '../dialogs/card-global-search/card-global-search.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private isCardSearch = false;
  private isBoardSearch = false;

  constructor(
    private apiService: ApiService,
    private modal: NgbModal
  ) {
  }
  cardTransition(card: CardEx, from: Column, to: Column): Observable<CardEx> {
    const instance = this.modal.open(
      CardTransitionConfirmationDialogComponent
    );

    instance.componentInstance.card = card;
    instance.componentInstance.from = from;
    instance.componentInstance.to = to;

    return instance.closed;
  }

  loginConfirmation(user: User): Observable<boolean> {
    const instance = this.modal.open(
      LoginConfirmationDialogComponent
    );

    instance.componentInstance.user = user;

    return instance.closed;
  }

  alert(text: string): Observable<any> {
    const instance = this.modal.open(AlertDialogComponent);
    instance.componentInstance.text = text;

    return instance.closed;
  }

  searchCard(): Observable<Card> {
    if (this.isCardSearch) {
      return EMPTY;
    }

    this.isCardSearch = true;
    const instance = this.modal.open(CardGlobalSearchComponent, {
      size: 'lg'
    });
    return instance.closed.pipe(finalize(() => this.isCardSearch = false));
  }

  searchBoard(closable: boolean = true): Observable<{spaceId: number, boardId: number}> {
    if (this.isBoardSearch) {
      return EMPTY;
    }

    this.isBoardSearch = true;
    const instance = this.modal.open(SearchBoardDialogComponent, {
      beforeDismiss() {
        return closable;
      }
    });

    return instance.closed.pipe(finalize(() => this.isBoardSearch = false));
  }

  loading<T>(): { close() } {
    const self = this;
    let instance: NgbModalRef = null;

    const timeout = setTimeout(() => {
      instance = self.modal.open(LoadingDialogComponent, {
        centered: true,
        keyboard: false,
        size: 'sm',
        backdrop: 'static',
        beforeDismiss() {
          return false;
        },
      });
    }, 500);

    return {
      close() {
        if (instance == null) {
          clearTimeout(timeout);
        } else {
          instance.close();
        }
      }
    };
  }
}