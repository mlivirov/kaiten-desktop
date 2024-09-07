import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CardEx } from '../models/card-ex';
import {
  catchError,
  EMPTY,
  EmptyError,
  filter,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
  throwIfEmpty, zip
} from 'rxjs';
import {
  CardTransitionConfirmationDialogComponent
} from '../dialogs/card-transition-confirmation-dialog/card-transition-confirmation-dialog.component';
import { Column } from '../models/column';
import { AlertDialogComponent } from '../dialogs/alert-dialog/alert-dialog.component';
import { inject, Injectable } from '@angular/core';
import { SearchBoardDialogComponent } from '../dialogs/search-board-dialog/search-board-dialog.component';
import { User } from '../models/user';
import {
  LoginConfirmationDialogComponent
} from '../dialogs/login-confirmation-dialog/login-confirmation-dialog.component';
import { Card } from '../models/card';
import { CardGlobalSearchComponent } from '../dialogs/card-global-search/card-global-search.component';
import { NewCardDialogComponent } from '../dialogs/card-editor-dialog/new-card-dialog.component';
import { DraftCardEditorService } from './implementations/draft-card-editor.service';
import {
  ConfirmationDialogButton,
  ConfirmationDialogComponent
} from '../dialogs/confirmation-dialog/confirmation-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private activeModals: Array<NgbModalRef> = [];

  constructor(
    private modal: NgbModal,
    private draftCardEditorService: DraftCardEditorService,
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

  confirmation(prompt: string, title?: string, buttons?: ConfirmationDialogButton[]): Observable<any> {
    const instance = this.modal.open(ConfirmationDialogComponent);
    this.activeModals.push(instance);

    instance.componentInstance.text = prompt;
    instance.componentInstance.title = title ?? 'Confirmation';
    instance.componentInstance.buttons = buttons || [
      { title: 'Cancel', resultCode: undefined, style: 'btn-secondary' },
      { title: 'Continue', resultCode: true, style: 'btn-primary' },
    ];

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

  createCard(boardId: number, laneId?: number, typeId?: number, title: string|null = null): Observable<number> {
    const newDraft$ = this.draftCardEditorService.createNewDraft(boardId, laneId, typeId, title);
    return this.draftCardEditorService
      .getLastDraft()
      .pipe(
        throwIfEmpty(),
        catchError((err) => err instanceof EmptyError ? of(null) : throwError(err)),
        switchMap(draft =>
          draft === null
            ? newDraft$
            : this.confirmation('There is unsaved draft. Would you like to continue editing?', null, [
                { title: 'Cancel', resultCode: undefined, style: 'btn-secondary' },
                { title: 'Discard', resultCode: 'discard', style: 'btn-danger' },
                { title: 'Continue editing', resultCode: 'continue', style: 'btn-primary' },
              ])
              .pipe(
                switchMap((result: string) => {
                  if (result === 'continue') {
                    return of(draft);
                  }

                  if (result === 'discard') {
                    return this.draftCardEditorService.deleteCard(draft.id)
                      .pipe(
                        switchMap(() => newDraft$),
                      );
                  }

                  return EMPTY;
                })
              )
        ),
        switchMap(card => zip(of(card.id), this.editCard(card))),
        switchMap(([draftId, newCardId]) => {
          if (newCardId !== undefined) {
            this.draftCardEditorService.deleteCard(draftId).pipe(map(() => newCardId));
          }

          return EMPTY;
        })
      );
  }

  editCard(card: CardEx, closable: boolean = true): Observable<number> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof NewCardDialogComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(NewCardDialogComponent, {
      beforeDismiss() {
        return closable;
      },
      size: 'xl',
    });

    instance.componentInstance.card = card;

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