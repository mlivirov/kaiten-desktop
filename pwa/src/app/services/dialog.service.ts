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
  throwIfEmpty,
  zip
} from 'rxjs';
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
import {
  CardGlobalSearchComponent,
  CardSearchSelectMode
} from '../dialogs/card-global-search/card-global-search.component';
import { NewCardDialogComponent } from '../dialogs/card-editor-dialog/new-card-dialog.component';
import { DraftCardEditorService } from './implementations/draft-card-editor.service';
import {
  ConfirmationDialogButton,
  ConfirmationDialogComponent
} from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import { BlockBlocker } from '../models/block-blocker.model';
import { CardBlockDialogComponent } from '../dialogs/card-block-dialog/card-block-dialog.component';
import { PromptAction, PromptDialogComponent } from '../dialogs/prompt-dialog/prompt-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private activeModals: Array<NgbModalRef> = [];

  public constructor(
    private modal: NgbModal,
    private draftCardEditorService: DraftCardEditorService,
  ) {
  }

  private removeActiveModal(modal: NgbModalRef): void {
    this.activeModals.splice(this.activeModals.indexOf(modal), 1);
  }

  public cardTransition(card: CardEx, from: Column, to: Column): Observable<CardEx> {
    const instance = this.modal.open(
      CardTransitionConfirmationDialogComponent
    );

    this.activeModals.push(instance);

    instance.componentInstance.card = card;
    instance.componentInstance.from = from;
    instance.componentInstance.to = to;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public loginConfirmation(user: User): Observable<boolean> {
    const instance = this.modal.open(
      LoginConfirmationDialogComponent
    );
    this.activeModals.push(instance);

    instance.componentInstance.user = user;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public alert(text: string): Observable<boolean> {
    const instance = this.modal.open(AlertDialogComponent);
    this.activeModals.push(instance);

    instance.componentInstance.text = text;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public confirmation(prompt: string, title?: string, buttons?: ConfirmationDialogButton[]): Observable<unknown> {
    const instance = this.modal.open(ConfirmationDialogComponent);
    this.activeModals.push(instance);

    instance.componentInstance.text = prompt;
    instance.componentInstance.title = title ?? 'Confirmation';
    instance.componentInstance.buttons = buttons || [
      { title: 'Cancel', resultCode: undefined, style: 'btn-secondary' },
      { title: 'Continue', resultCode: true, style: 'btn-primary' },
    ];

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public editBlocker(cardId: number, blockerId?: number): Observable<BlockBlocker> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof CardBlockDialogComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(CardBlockDialogComponent, {
      scrollable: true
    });
    instance.componentInstance.cardId = cardId;
    instance.componentInstance.blockerId = blockerId;

    this.activeModals.push(instance);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
        }),
        filter(r => !!r)
      );
  }

  public searchCard(selectMode: CardSearchSelectMode = 'none', title = 'Search everywhere'): Observable<CardEx[]> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof CardGlobalSearchComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(CardGlobalSearchComponent, {
      size: 'xl',
      scrollable: true
    });
    instance.componentInstance.selectMode = selectMode;
    instance.componentInstance.title = title;
    this.activeModals.push(instance);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public searchBoard(closable: boolean = true): Observable<{spaceId: number, boardId: number}> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof SearchBoardDialogComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(SearchBoardDialogComponent, {
      beforeDismiss() {
        return closable;
      }
    });

    this.activeModals.push(instance);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public createCard(boardId: number, laneId?: number, typeId?: number, title: string|null = null): Observable<number> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof NewCardDialogComponent)) {
      return EMPTY;
    }

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
          if (newCardId) {
            return this.draftCardEditorService.deleteCard(draftId).pipe(map(() => newCardId));
          }

          return EMPTY;
        }),
      );
  }

  public editCard(card: CardEx, closable: boolean = true): Observable<number> {
    if (this.activeModals.some(modal => modal.componentInstance instanceof NewCardDialogComponent)) {
      return EMPTY;
    }

    const instance = this.modal.open(NewCardDialogComponent, {
      beforeDismiss() {
        return closable;
      },
      size: 'xl',
      modalDialogClass: 'modal-90-prc'
    });

    instance.componentInstance.card = card;

    this.activeModals.push(instance);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

  public prompt<T = string>(title: string, label: string = 'Please enter value', action: PromptAction<T>): Observable<T> {
    const instance = this.modal.open(PromptDialogComponent<T>);
    this.activeModals.push(instance);

    instance.componentInstance.title = title;
    instance.componentInstance.label = label;
    instance.componentInstance.action = action;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
        }),
        map(returnValue => <T>returnValue)
      );
  }

  public hasOpenDialog(): boolean {
    return this.activeModals.length > 0;
  }

  public closeMostRecent(): void {
    this.activeModals[this.activeModals.length - 1].close();
  }

  public showNotImplementedDialog(): Observable<boolean> {
    return this.alert('We are sorry, this feature is not implemented yet. Stay tuned!');
  }
}
