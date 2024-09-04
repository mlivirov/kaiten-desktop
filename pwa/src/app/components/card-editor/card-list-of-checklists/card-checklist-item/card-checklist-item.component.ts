import { Component, ElementRef, EventEmitter, HostListener, Injectable, Input, Output, ViewChild } from '@angular/core';
import { CheckListItem } from '../../../../models/check-list-item';
import {
  NgbDropdown,
  NgbDropdownAnchor,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbInputDatepicker,
  NgbPopover,
  NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, finalize, map, Observable, OperatorFunction, switchMap, tap } from 'rxjs';
import { User } from '../../../../models/user';
import { ApiService } from '../../../../services/api.service';
import { DatePipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { InlineMemberComponent } from '../../../inline-member/inline-member.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdEditorComponent } from '../../../md-editor/md-editor.component';
import { MdViewerComponent } from '../../../md-viewer/md-viewer.component';
import { TimeagoModule } from 'ngx-timeago';
import { CardChecklistService } from '../card-checklist/card-checklist.component';

@Injectable({providedIn: 'root'})
export class CardChecklistItemService {
  public openedPopover?: NgbPopover;
  public editing?: CardChecklistItemComponent;
}

enum ExpirationStatus {
  FAR,
  WEEK,
  TODAY,
  EXPIRED,
}

@Component({
  selector: 'app-card-checklist-item',
  standalone: true,
  imports: [
    DatePipe,
    InlineMemberComponent,
    NgIf,
    NgbDropdown,
    NgbDropdownAnchor,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbTooltip,
    NgbInputDatepicker,
    NgbTypeahead,
    ReactiveFormsModule,
    MdEditorComponent,
    MdViewerComponent,
    NgForOf,
    TimeagoModule,
    FormsModule,
    NgbPopover,
    NgTemplateOutlet
  ],
  templateUrl: './card-checklist-item.component.html',
  styleUrl: './card-checklist-item.component.scss'
})
export class CardChecklistItemComponent {
  ExpirationStatus = ExpirationStatus;

  @Input({required: true})
  cardId: number;

  @Input({required: true})
  checklistId: number;

  @Input({required: true})
  item: CheckListItem;

  isSaving: boolean = false;

  editing?: CheckListItem;

  isEditingText: boolean = false;

  @ViewChild('editDatePopover', { read: NgbPopover })
  editDatePopover: NgbPopover;

  @ViewChild('editUserPopover', { read: NgbPopover })
  editUserPopover: NgbPopover;

  @Output()
  insertBefore: EventEmitter<CheckListItem> = new EventEmitter();

  @Output()
  insertAfter: EventEmitter<CheckListItem> = new EventEmitter();

  @Output()
  delete: EventEmitter<CheckListItem> = new EventEmitter();

  @Input()
  disabled: boolean = false;

  @ViewChild('editor', { read: ElementRef })
  editor: ElementRef;

  allUsersTypeaheadSearch: OperatorFunction<string, readonly User[]>
    = (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return this.apiService.getCardAllowedUsers(this.cardId, 0, 10, term);
        })
      );

  userTypeaheadFormatter = (item: User) => item.full_name;

  constructor(
    private apiService: ApiService,
    public service: CardChecklistItemService,
    public listService: CardChecklistService
  ) {
  }

  getExpirationStatus() {
    if (!this.item.due_date) {
      return ExpirationStatus.FAR;
    }

    const millisInDay = 1000 * 60 * 60 * 24;
    const timeToDue = new Date(this.item.due_date).getTime() - Date.now();

    if (timeToDue > millisInDay * 5) {
      return ExpirationStatus.FAR;
    } else if (timeToDue > millisInDay) {
      return ExpirationStatus.WEEK;
    } else if (timeToDue > 0) {
      return ExpirationStatus.TODAY;
    }

    return ExpirationStatus.EXPIRED;
  }

  updateChecklistItemState(value: boolean) {
    this.service.openedPopover?.close()
    this.updateCheckListItem(this.item.id, { checked: value }).subscribe();
  }

  updateCheckListItem(id: number, data: Partial<CheckListItem>): Observable<void> {
    this.isSaving = true;
    return this.apiService.updateCardCheckListItem(this.cardId, this.checklistId, id, data)
      .pipe(
        tap(res => {
          Object.assign(this.item, res);
        }),
        finalize(() => this.isSaving = false),
        map(() => {})
      );
  }

  openItemTextEditor(event: Event|null, focus: boolean = false) {
    if (this.isSaving) {
      return;
    }

    this.service.editing?.discardChanges(event);
    this.listService.editing?.discardChanges(event);

    this.editing = Object.assign({}, this.item);
    this.isEditingText = true;
    this.service.editing = this;

    event?.preventDefault();
    event?.stopPropagation();

    if (focus) {
      setTimeout(() => {
        const editorElement = (this.editor?.nativeElement as HTMLElement).querySelector('[contenteditable]') as HTMLElement;
        editorElement.scrollIntoView({
          block: 'center'
        });
        editorElement.focus({ preventScroll: true });
      }, 1);
    }
  }

  saveText(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.editing.text?.length < 1) {
      this.delete.emit(this.item);
      this.discardChanges(event);
    } else {
      this
        .updateCheckListItem(this.editing.id, { text: this.editing.text })
        .subscribe(() => {
          this.discardChanges(event);
        });
    }
  }

  openDueDateEditor(event: MouseEvent) {
    if (this.service.openedPopover) {
      this.service.openedPopover?.close();
      return;
    }

    this.editing = Object.assign({}, this.item);
    this.editDatePopover.positionTarget = event.target as HTMLElement;
    this.editDatePopover.open();
    this.service.openedPopover = this.editDatePopover;
  }

  openUserEditor(event: MouseEvent) {
    if (this.service.openedPopover) {
      this.service.openedPopover?.close();
      return;
    }

    this.editing = Object.assign({}, this.item);
    this.editUserPopover.positionTarget = event.target as HTMLElement;
    this.editUserPopover.open();
    this.service.openedPopover = this.editUserPopover;
  }

  saveUser(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this
      .updateCheckListItem(this.editing.id, { responsible_id: this.editing.responsible_id })
      .subscribe(() => {
        this.editUserPopover.close();
      });
  }

  saveDate(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this
      .updateCheckListItem(this.editing.id, { due_date: this.editing.due_date })
      .subscribe(() => {
        this.editDatePopover.close();
      });
  }

  discardChanges(event: Event|null = null) {
    event?.preventDefault();
    event?.stopPropagation();

    this.service.openedPopover?.close();
    this.service.openedPopover = null;
    this.editing = null;
    this.isEditingText = false;
    this.service.editing = null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape' && this.service.openedPopover) {
      this.service.openedPopover?.close();
      event.preventDefault();
      event.stopPropagation();
    } else if (event.code === 'Escape' && this.isEditingText) {
      this.discardChanges(event);
    } else if (event.code === 'Enter' && event.ctrlKey && this.isEditingText) {
      this.saveText(event);
    }
  }

  @HostListener('window:click', ['$event'])
  handleOutsizeClick(event: MouseEvent) {
    const isClickedPopoverControl = !!(<HTMLElement>event.target).closest('.popover-control');
    const isClickedInsidePopover = !!(<HTMLElement>event.target).closest('ngb-popover-window');
    const clickedItemId = (<HTMLElement>event.target).closest('[data-checklist-item-id]')?.getAttributeAsNumber('data-checklist-item-id');

    if (this.service.openedPopover && !(isClickedPopoverControl || isClickedInsidePopover)) {
      this.service.openedPopover.close();

      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('window:resize', ['$event'])
  handleWindowResize(event: Event) {
    if (this.service.openedPopover) {
      this.service.openedPopover?.close();
      event.preventDefault();
      event.stopPropagation();
    }
  }

}
