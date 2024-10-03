import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CheckList } from '../../../../models/check-list';
import { DatePipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { InlineMemberComponent } from '../../../inline-member/inline-member.component';
import {
  NgbDateAdapter,
  NgbDropdown,
  NgbDropdownAnchor,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbInputDatepicker,
  NgbPopover,
  NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TimeagoModule } from 'ngx-timeago';
import { MdViewerComponent } from '../../../md-viewer/md-viewer.component';
import { CheckListItem } from '../../../../models/check-list-item';
import { finalize, tap } from 'rxjs';
import { NgbDateStringAdapter } from '../../ngb-date-string-adapter.service';
import { MdEditorComponent } from '../../../md-editor/md-editor.component';
import {
  CardChecklistItemComponent,
} from '../card-checklist-item/card-checklist-item.component';
import { unionIfNotExists } from '../../../../functions/union-if-not-exists';
import { TextEditorComponent, TextEditorSaveEvent } from '../../../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../../services/card-editor.service';
import { CurrentBoardService } from '../../../../services/current-board.service';
import { DialogService } from '../../../../services/dialog.service';
import { Router } from '@angular/router';
import { nameof } from '../../../../functions/name-of';

@Component({
  selector: 'app-card-checklist',
  standalone: true,
  imports: [
    NgForOf,
    InlineMemberComponent,
    NgIf,
    NgbTooltip,
    DatePipe,
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
    CardChecklistItemComponent,
    TextEditorComponent
  ],
  templateUrl: './card-checklist.component.html',
  styleUrl: './card-checklist.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: NgbDateStringAdapter }
  ]
})
export class CardChecklistComponent implements OnChanges {
  @Input() public checklist?: CheckList;
  @Input({required: true}) public cardId: number;
  @Input() public disabled: boolean = false;
  @Output() protected delete: EventEmitter<CheckList> = new EventEmitter();
  @ViewChildren(CardChecklistItemComponent) protected itemsComponents: QueryList<CardChecklistItemComponent> = new QueryList();
  @ViewChild(TextEditorComponent) protected textEditorComponent: TextEditorComponent;
  protected isSaving: boolean = false;

  public constructor(
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    private currentBoardService: CurrentBoardService,
    private dialogService: DialogService,
    private router: Router,
  ) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardChecklistComponent>('checklist')]) {
      this.sortItems();
    }
  }

  public openTextEditor(): void {
    this.textEditorComponent.openEditor(null, true);
  }

  protected deleteItem(item: CheckListItem): void {
    this.isSaving = true;
    this.cardEditorService
      .deleteCheckListItem(this.cardId, this.checklist.id, item.id)
      .pipe(
        finalize(() => this.isSaving = false),
        tap(() => {
          const indexOfDeleted = this.checklist.items.indexOf(item);
          this.checklist.items.splice(indexOfDeleted, 1);
        }),
      )
      .subscribe();
  }

  protected createCardFromItem(item: CheckListItem): void {
    this.dialogService
      .createCard({
        board_id: this.currentBoardService.boardId,
        lane_id: this.currentBoardService.laneId,
        title: item.text
      })
      .subscribe(id => this.router.navigate(['card', id]));
  }

  protected insertAfter(item: CheckListItem): void {
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

  protected insertBefore(item: CheckListItem): void {
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

  protected appendItem(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const position = this.checklist.items?.length
      ? this.checklist.items[this.checklist.items.length - 1].sort_order + 1
      : 1;

    this.insertItem(position);
  }

  protected saveText(event: TextEditorSaveEvent): void {
    this.isSaving = true;
    this.cardEditorService
      .updateCardCheckList(this.cardId, this.checklist.id, {
        name: event.value
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe(updated => {
        Object.assign(this.checklist, updated);
        event.commit();
      });
  }

  // TODO: extract into standalone function
  private sortItems(): void {
    this.checklist.items?.sort((a, b) => a.sort_order - b.sort_order);
  }

  private insertItem(offset: number): void {
    this.isSaving = true;
    this.cardEditorService
      .addCheckListItem(this.cardId, this.checklist.id, `This is your ${this.checklist.items?.length ?? 1} item.`, offset)
      .pipe(
        finalize(() => this.isSaving = false)
      )
      .subscribe(item => {
        this.checklist.items = unionIfNotExists(this.checklist.items, item, 'id');
        this.sortItems();

        setTimeout(() => {
          const found = this.itemsComponents.find(t => t.item.id == item.id);
          found.openTextEditor();
        }, 1);
      });
  }
  
}
