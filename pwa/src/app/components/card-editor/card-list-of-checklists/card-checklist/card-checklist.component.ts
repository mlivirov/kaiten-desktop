import {
  Component, ElementRef,
  EventEmitter, HostListener, Injectable,
  Input,
  OnChanges,
  Output, QueryList,
  SimpleChanges, ViewChild, ViewChildren,
} from '@angular/core';
import { CheckList } from '../../../../models/check-list';
import { DatePipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { InlineMemberComponent } from '../../../inline-member/inline-member.component';
import {
  NgbDateAdapter,
  NgbDropdown,
  NgbDropdownAnchor,
  NgbDropdownItem,
  NgbDropdownMenu, NgbInputDatepicker, NgbPopover,
  NgbTooltip, NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { FetchUserDirective } from '../../../../directives/fetch-user.directive';
import { FormsModule } from '@angular/forms';
import { TimeagoModule } from 'ngx-timeago';
import { MdViewerComponent } from '../../../md-viewer/md-viewer.component';
import { CheckListItem } from '../../../../models/check-list-item';
import { ApiService } from '../../../../services/api.service';
import { finalize, tap } from 'rxjs';
import { NgbDateStringAdapter } from '../../ngb-date-string-adapter.service';
import { MdEditorComponent } from '../../../md-editor/md-editor.component';
import {
  CardChecklistItemComponent,
  CardChecklistItemService
} from '../card-checklist-item/card-checklist-item.component';
import { UnionIfNotExistsFunction } from '../../../../functions/union-if-not-exists.function';

@Injectable({providedIn: 'root'})
export class CardChecklistService {
  public editing?: CardChecklistComponent;
}

@Component({
  selector: 'app-card-checklist',
  standalone: true,
  imports: [
    NgForOf,
    InlineMemberComponent,
    NgIf,
    NgbTooltip,
    DatePipe,
    FetchUserDirective,
    FormsModule,
    TimeagoModule,
    NgTemplateOutlet,
    MdViewerComponent,
    NgbDropdown,
    NgbDropdownAnchor,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbPopover,
    NgbInputDatepicker,
    NgbTypeahead,
    MdEditorComponent,
    CardChecklistItemComponent
  ],
  templateUrl: './card-checklist.component.html',
  styleUrl: './card-checklist.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: NgbDateStringAdapter }
  ]
})
export class CardChecklistComponent implements OnChanges {
  @Input()
  checklist?: CheckList;

  @Input({required: true})
  cardId: number;

  @Input()
  disabled: boolean = false;

  isSaving: boolean = false;

  isEditingText : boolean = false;

  editing?: CheckList;

  @Output()
  delete: EventEmitter<CheckList> = new EventEmitter();

  @ViewChild('editor', { read: ElementRef })
  editor: ElementRef;

  @ViewChildren(CardChecklistItemComponent)
  items: QueryList<CardChecklistItemComponent> = new QueryList();

  constructor(
    private apiService: ApiService,
    private service: CardChecklistService,
    private itemService: CardChecklistItemService
  ) {
  }

  sortItems() {
    this.checklist.items?.sort((a, b) => a.sort_order - b.sort_order);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.sortItems();
  }

  deleteItem(item: CheckListItem) {
    this.isSaving = true;
    this.apiService.deleteCheckListItem(this.cardId, this.checklist.id, item.id)
      .pipe(
        finalize(() => this.isSaving = false),
        tap(() => {
          const indexOfDeleted = this.checklist.items.indexOf(item);
          this.checklist.items.splice(indexOfDeleted, 1);
        }),
      )
      .subscribe();
  }

  insertAfter(item: CheckListItem) {
    let position = item.sort_order;
    const indexOfItem = this.checklist.items.indexOf(item);
    if (indexOfItem === this.checklist.items.length - 1) {
      position++;
    } else {
      const nextItemPosition = this.checklist.items[indexOfItem + 1].sort_order;

      position = (position + nextItemPosition) / 2;
    }

    this.insertItem(position);
  }

  insertBefore(item: CheckListItem) {
    let position = item.sort_order;
    const indexOfItem = this.checklist.items.indexOf(item);
    if (indexOfItem === 0) {
      position /= 2;
    } else {
      const prevItemPosition = this.checklist.items[indexOfItem - 1].sort_order;

      position = (position + prevItemPosition) / 2;
    }

    this.insertItem(position);
  }

  appendItem(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const position = this.checklist.items?.length
      ? this.checklist.items[this.checklist.items.length - 1].sort_order + 1
      : 1;

    this.insertItem(position);
  }

  insertItem(offset: number) {
    this.isSaving = true;
    this.apiService.addCheckListItem(this.cardId, this.checklist.id, `This is your ${this.checklist.items?.length ?? 1} item.`, offset)
      .pipe(
        finalize(() => this.isSaving = false)
      )
      .subscribe(item => {
        this.checklist.items = UnionIfNotExistsFunction(this.checklist.items, item, 'id');
        this.sortItems();

        setTimeout(() => {
          const found = this.items.find(t => t.item.id == item.id);
          found.openItemTextEditor(null, true);
        }, 0);
      });
  }

  openTextEditor(event: Event|null, focus: boolean = false) {
    if (this.isSaving) {
      return;
    }

    this.itemService.editing?.discardChanges(event);
    this.service.editing?.discardChanges(event);

    this.editing = Object.assign({}, this.checklist);
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
    event.stopPropagation();
    event.preventDefault();

    this.isSaving = true;
    this.apiService
      .updateCardCheckList(this.cardId, this.checklist.id, {
        name: this.editing.name
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.discardChanges();
        }),
      )
      .subscribe(updated => Object.assign(this.checklist, updated));
  }

  discardChanges(event: Event|null = null) {
    event?.preventDefault();
    event?.stopPropagation();

    this.editing = null;
    this.isEditingText = false;
    this.service.editing = null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape' && this.isEditingText) {
      this.discardChanges(event);
    } else if (event.code === 'Enter' && event.ctrlKey && this.isEditingText) {
      this.saveText(event);
    }
  }
}
