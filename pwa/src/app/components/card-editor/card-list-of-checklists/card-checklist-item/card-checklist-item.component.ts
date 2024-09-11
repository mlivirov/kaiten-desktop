import {
  Component,
  EventEmitter,
  HostListener,
  Inject,
  inject,
  Injectable,
  Input,
  Output,
  ViewChild
} from '@angular/core';
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
import { FileService } from '../../../../services/file.service';
import { DatePipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { InlineMemberComponent } from '../../../inline-member/inline-member.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdEditorComponent } from '../../../md-editor/md-editor.component';
import { MdViewerComponent } from '../../../md-viewer/md-viewer.component';
import { TimeagoModule } from 'ngx-timeago';
import { TextEditorComponent, TextEditorSaveEvent } from '../../../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../../services/card-editor.service';
import { CardUsersTypeaheadOperator } from '../../../../functions/typeahead/card-users.typeahead-operator';
import { Router } from '@angular/router';

@Injectable({providedIn: 'root'})
class CardChecklistItemEditorSyncService {
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
    NgTemplateOutlet,
    TextEditorComponent
  ],
  templateUrl: './card-checklist-item.component.html',
  styleUrl: './card-checklist-item.component.scss',
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

  @Output()
  createCard: EventEmitter<CheckListItem> = new EventEmitter();

  @Input()
  disabled: boolean = false;

  @ViewChild(TextEditorComponent)
  textEditorComponent: TextEditorComponent;

  allUsersTypeaheadOperator = CardUsersTypeaheadOperator(() => this.cardId);

  userTypeaheadFormatter = (item: User) => item.full_name;

  constructor(
    public editorSyncService: CardChecklistItemEditorSyncService,
    @Inject(CARD_EDITOR_SERVICE) private editorService: CardEditorService
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
    this.editorSyncService.openedPopover?.close()
    this.updateCheckListItem(this.item.id, { checked: value }).subscribe();
  }

  updateCheckListItem(id: number, data: Partial<CheckListItem>): Observable<void> {
    this.isSaving = true;
    return this.editorService
      .updateCardCheckListItem(this.cardId, this.checklistId, id, data)
      .pipe(
        tap(res => {
          Object.assign(this.item, res);
        }),
        finalize(() => this.isSaving = false),
        map(() => {})
      );
  }

  saveText(event: TextEditorSaveEvent) {
    if (event.value?.length < 1) {
      this.delete.emit(this.item);
    } else {
      this
        .updateCheckListItem(this.item.id, { text: event.value })
        .subscribe(event.commit.bind(event));
    }
  }

  openDueDateEditor(event: MouseEvent) {
    if (this.editorSyncService.openedPopover) {
      this.editorSyncService.openedPopover?.close();
      return;
    }

    this.editing = Object.assign({}, this.item);
    this.editDatePopover.positionTarget = event.target as HTMLElement;
    this.editDatePopover.open();
    this.editorSyncService.openedPopover = this.editDatePopover;
  }

  openUserEditor(event: MouseEvent) {
    if (this.editorSyncService.openedPopover) {
      this.editorSyncService.openedPopover?.close();
      return;
    }

    this.editing = Object.assign({}, this.item);
    this.editUserPopover.positionTarget = event.target as HTMLElement;
    this.editUserPopover.open();
    this.editorSyncService.openedPopover = this.editUserPopover;
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

  clearUser(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this
      .updateCheckListItem(this.editing.id, { responsible_id: null })
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

    this.editorSyncService.openedPopover?.close();
    this.editorSyncService.openedPopover = null;
    this.editing = null;
    this.editorSyncService.editing = null;
  }

  openTextEditor() {
    this.textEditorComponent.openEditor(null, true);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape' && this.editorSyncService.openedPopover) {
      this.editorSyncService.openedPopover?.close();

      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('window:click', ['$event'])
  handleOutsizeClick(event: MouseEvent) {
    const isClickedPopoverControl = !!(<HTMLElement>event.target).closest('.popover-control');
    const isClickedInsidePopover = !!(<HTMLElement>event.target).closest('ngb-popover-window');
    const isClickedInsideTypeahead = !!(<HTMLElement>event.target).closest('ngb-typeahead-window');
    const clickedItemId = (<HTMLElement>event.target).closest('[data-checklist-item-id]')?.getAttributeAsNumber('data-checklist-item-id');

    if (this.editorSyncService.openedPopover && !(isClickedPopoverControl || isClickedInsidePopover || isClickedInsideTypeahead)) {
      this.editorSyncService.openedPopover.close();

      event.preventDefault();
      event.stopPropagation();
    }
  }
}
