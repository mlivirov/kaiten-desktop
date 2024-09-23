import {
  Component,
  EventEmitter,
  HostListener,
  Inject,
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
import { finalize, map, Observable, tap } from 'rxjs';
import { User } from '../../../../models/user';
import { DatePipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { InlineMemberComponent } from '../../../inline-member/inline-member.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdEditorComponent } from '../../../md-editor/md-editor.component';
import { MdViewerComponent } from '../../../md-viewer/md-viewer.component';
import { TimeagoModule } from 'ngx-timeago';
import { TextEditorComponent, TextEditorSaveEvent } from '../../../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../../services/card-editor.service';
import { CardUsersTypeaheadOperator } from '../../../../functions/typeahead/card-users.typeahead-operator';

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
  @Input({required: true}) public cardId: number;
  @Input({required: true}) public checklistId: number;
  @Input({required: true}) public item: CheckListItem;
  @Input() public disabled: boolean = false;
  protected readonly ExpirationStatus = ExpirationStatus;
  protected readonly allUsersTypeaheadOperator = CardUsersTypeaheadOperator(() => this.cardId);
  protected readonly userTypeaheadFormatter = (item: User): string => item.full_name;
  protected isSaving: boolean = false;
  protected editing?: CheckListItem;
  @ViewChild('editDatePopover', { read: NgbPopover }) protected editDatePopover: NgbPopover;
  @ViewChild('editUserPopover', { read: NgbPopover }) protected editUserPopover: NgbPopover;
  @Output() protected insertBefore: EventEmitter<CheckListItem> = new EventEmitter();
  @Output() protected insertAfter: EventEmitter<CheckListItem> = new EventEmitter();
  @Output() protected delete: EventEmitter<CheckListItem> = new EventEmitter();
  @Output() protected createCard: EventEmitter<CheckListItem> = new EventEmitter();
  @ViewChild(TextEditorComponent) protected textEditorComponent: TextEditorComponent;

  public constructor(
    public editorSyncService: CardChecklistItemEditorSyncService,
    @Inject(CARD_EDITOR_SERVICE) private editorService: CardEditorService
  ) {
  }

  public openTextEditor(): void {
    this.textEditorComponent.openEditor(null, true);
  }

  protected getExpirationStatus(): ExpirationStatus {
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

  protected updateChecklistItemState(value: boolean): void {
    this.editorSyncService.openedPopover?.close();
    this.updateCheckListItem(this.item.id, { checked: value }).subscribe();
  }

  protected saveText(event: TextEditorSaveEvent): void {
    if (event.value?.length < 1) {
      this.delete.emit(this.item);
    } else {
      this
        .updateCheckListItem(this.item.id, { text: event.value })
        .subscribe(event.commit.bind(event));
    }
  }

  protected openDueDateEditor(event: MouseEvent): void {
    if (this.editorSyncService.openedPopover) {
      this.editorSyncService.openedPopover?.close();
      return;
    }

    this.editing = Object.assign({}, this.item);
    this.editDatePopover.positionTarget = event.target as HTMLElement;
    this.editDatePopover.open();
    this.editorSyncService.openedPopover = this.editDatePopover;
  }

  protected openUserEditor(event: MouseEvent): void {
    if (this.editorSyncService.openedPopover) {
      this.editorSyncService.openedPopover?.close();
      return;
    }

    this.editing = Object.assign({}, this.item);
    this.editUserPopover.positionTarget = event.target as HTMLElement;
    this.editUserPopover.open();
    this.editorSyncService.openedPopover = this.editUserPopover;
  }

  protected saveUser(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this
      .updateCheckListItem(this.editing.id, { responsible_id: this.editing.responsible_id })
      .subscribe(() => {
        this.editUserPopover.close();
      });
  }

  protected clearUser(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this
      .updateCheckListItem(this.editing.id, { responsible_id: null })
      .subscribe(() => {
        this.editUserPopover.close();
      });
  }

  protected saveDate(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this
      .updateCheckListItem(this.editing.id, { due_date: this.editing.due_date })
      .subscribe(() => {
        this.editDatePopover.close();
      });
  }

  protected discardChanges(event: Event|null = null): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.editorSyncService.openedPopover?.close();
    this.editorSyncService.openedPopover = null;
    this.editing = null;
    this.editorSyncService.editing = null;
  }

  private updateCheckListItem(id: number, data: Partial<CheckListItem>): Observable<void> {
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

  @HostListener('window:keydown', ['$event'])
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Escape' && this.editorSyncService.openedPopover) {
      this.editorSyncService.openedPopover?.close();

      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('window:click', ['$event'])
  private handleOutsizeClick(event: MouseEvent): void {
    const isClickedPopoverControl = !!(<HTMLElement>event.target).closest('.popover-control');
    const isClickedInsidePopover = !!(<HTMLElement>event.target).closest('ngb-popover-window');
    const isClickedInsideTypeahead = !!(<HTMLElement>event.target).closest('ngb-typeahead-window');

    if (this.editorSyncService.openedPopover && !(isClickedPopoverControl || isClickedInsidePopover || isClickedInsideTypeahead)) {
      this.editorSyncService.openedPopover.close();

      event.preventDefault();
      event.stopPropagation();
    }
  }
}
