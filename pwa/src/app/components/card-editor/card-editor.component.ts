import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  AsyncPipe,
  DatePipe,
  JsonPipe,
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgTemplateOutlet
} from '@angular/common';
import { MdEditorComponent } from '../md-editor/md-editor.component';
import { FormsModule } from '@angular/forms';
import { CardEx } from '../../models/card-ex';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { filter, finalize, map, Observable, switchMap, tap } from 'rxjs';
import {
  ListOfRelatedCardsComponent
} from './card-references-accordion/list-of-related-cards/list-of-related-cards.component';
import { CardStateLabelComponent } from './card-state-label/card-state-label.component';
import { CardReferencesAccordionComponent } from './card-references-accordion/card-references-accordion.component';
import { RouterLink } from '@angular/router';
import { TimeagoModule } from 'ngx-timeago';
import { CardCommentsComponent } from './card-comments/card-comments.component';
import { EditorPropertyTemplate, PropertiesEditorComponent, } from '../properties-editor/properties-editor.component';
import {
  NgbCollapse,
  NgbDatepicker,
  NgbDropdown,
  NgbDropdownAnchor,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbInputDatepicker,
  NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { CardPropertiesComponent } from './card-properties/card-properties.component';
import { CardChecklistComponent } from './card-list-of-checklists/card-checklist/card-checklist.component';
import { CardListOfChecklistsComponent } from './card-list-of-checklists/card-list-of-checklists.component';
import { UnionIfNotExistsFunction } from '../../functions/union-if-not-exists.function';
import { TextEditorComponent, TextEditorSaveEvent } from '../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';
import { CardState } from '../../models/card-state';
import { BoardService } from '../../services/board.service';
import { CardType } from '../../models/card-type';
import { SettingService } from '../../services/setting.service';
import { formatCardLinkForClipboard } from '../../functions/format-card-link-for-clipboard.function';
import { Setting } from '../../models/setting';
import { CopyToClipboardButtonComponent } from '../copy-to-clipboard-button/copy-to-clipboard-button.component';
import { CardAttachmentsComponent } from './card-attachments/card-attachments.component';
import { DialogService } from '../../services/dialog.service';
import { MdViewerComponent } from '../md-viewer/md-viewer.component';


@Component({
  selector: 'app-card-editor',
  standalone: true,
  imports: [
    DatePipe,
    MdEditorComponent,
    FormsModule,
    NgForOf,
    NgIf,
    InlineMemberComponent,
    JsonPipe,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    ListOfRelatedCardsComponent,
    CardStateLabelComponent,
    CardReferencesAccordionComponent,
    RouterLink,
    TimeagoModule,
    CardCommentsComponent,
    PropertiesEditorComponent,
    EditorPropertyTemplate,
    NgbDatepicker,
    NgbInputDatepicker,
    NgbTypeahead,
    AsyncPipe,
    NgbTooltip,
    CardPropertiesComponent,
    NgTemplateOutlet,
    CardChecklistComponent,
    CardListOfChecklistsComponent,
    NgbDropdown,
    NgbDropdownAnchor,
    NgbDropdownItem,
    NgbDropdownMenu,
    TextEditorComponent,
    NgbCollapse,
    NgbDropdownToggle,
    CopyToClipboardButtonComponent,
    CardAttachmentsComponent,
    MdViewerComponent,
  ],
  templateUrl: './card-editor.component.html',
  styleUrl: './card-editor.component.scss',
})
export class CardEditorComponent implements OnInit {
  CardState = CardState;

  @Input()
  showHeader: boolean = true;

  @Input()
  card: CardEx;

  @Input()
  showComments: boolean = true

  @Input()
  showReferences: boolean = true;

  @Input()
  alwaysEditable: boolean = false;

  isSaving: boolean = false;

  @ViewChild(CardListOfChecklistsComponent)
  cardListOfChecklists: CardListOfChecklistsComponent;

  @ViewChild(CardReferencesAccordionComponent)
  cardReferencesAccordionComponent: CardReferencesAccordionComponent;

  @Output()
  delete: EventEmitter<number> = new EventEmitter();

  @Output()
  update: EventEmitter<number> = new EventEmitter();

  @Input()
  collapsableProperties: boolean = false;

  isCollapsedProperties: boolean = false;

  cardTypes: CardType[] = [];

  clipboardLink$: Observable<string>;

  constructor(
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    private boardService: BoardService,
    private settingService: SettingService,
    private dialogService: DialogService
  ) {
    boardService.getCardTypes().subscribe(types => this.cardTypes = types);

    this.clipboardLink$ = this.settingService
      .getSetting(Setting.ApiUrl)
      .pipe(
        map(baseUrl => formatCardLinkForClipboard(baseUrl, this.card))
      );
  }

  updateAsap(value: boolean) {
    this.updateCard({ asap: value }).subscribe();
  }

  addChecklist() {
    this.isSaving = true;
    this.cardEditorService
      .addCardCheckList(this.card.id, {
        name: `This is your ${this.card.checklists?.length ?? 1} checklist`,
      })
      .pipe(
        finalize(() => this.isSaving = false)
      )
      .subscribe(checklist => {
        this.card.checklists = UnionIfNotExistsFunction(this.card.checklists, checklist, 'id');

        setTimeout(() => {
          const found = this.cardListOfChecklists.checklists.find(t => t.checklist.id == checklist.id);
          found.openTextEditor();
        }, 1);
      });
  }

  saveType(type: CardType): void {
    this
      .updateCard({ type_id: type.id })
      .subscribe(() => {
        this.card.type = type;
      });
  }

  saveTitle(saveEvent: TextEditorSaveEvent): void {
    this
      .updateCard({ title: saveEvent.value })
      .subscribe(saveEvent.commit.bind(saveEvent));
  }

  saveDescription(saveEvent: TextEditorSaveEvent): void {
    this
      .updateCard({ description: saveEvent.value })
      .subscribe(saveEvent.commit.bind(saveEvent));
  }

  updateCard(data: Partial<CardEx>): Observable<void> {
    this.isSaving = true;
    return this.cardEditorService
      .updateCard(this.card.id, data)
      .pipe(
        finalize(() => this.isSaving = false),
        tap((card) => {
          Object.assign(this.card, card);
        }),
        map(() => {})
      );
  }

  instantUpdateTitle(value: string) {
    this.card.title = value;
    return this.cardEditorService
      .updateCard(this.card.id, {
        title: this.card.title,
      })
      .subscribe();
  }

  instantUpdateDescription(value: string) {
    this.card.description = value;
    return this.cardEditorService
      .updateCard(this.card.id, {
        description: this.card.description,
      })
      .subscribe();
  }

  ngOnInit(): void {
    if (this.collapsableProperties) {
      this.isCollapsedProperties = window.innerWidth < 768;
    }
  }

  focusBlocker() {
    this.cardReferencesAccordionComponent?.focusByType('BLOCKER');
  }

  deleteParent(id: number) {
    this.isSaving = true;
    this.cardEditorService
      .removeRelation(id, this.card.id)
      .pipe(
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(card => {
        this.card = card;
        this.update.emit(this.card.id);
      });
  }

  deleteChild(id: number) {
    this.isSaving = true;
    this.cardEditorService
      .removeRelation(this.card.id, id)
      .pipe(
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(card => {
        this.card = card;
        this.update.emit(this.card.id);
      });
  }

  addParent() {
    this.isSaving = true;
    this.dialogService
      .searchCard('single')
      .pipe(
        filter(r => !!r),
        switchMap(r => this.cardEditorService.addRelation(r[0].id, this.card.id)),
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(card => {
        this.card = card;
        this.update.emit(this.card.id);
      });
  }

  addChild() {
    this.isSaving = true;
    this.dialogService
      .searchCard('single')
      .pipe(
        filter(r => !!r),
        switchMap(r => this.cardEditorService.addRelation(this.card.id, r[0].id)),
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(card => {
        this.card = card;
        this.update.emit(this.card.id);
      });
  }

  addRelated() {
    this.isSaving = true;
    this.dialogService
      .searchCard('single')
      .pipe(
        filter(r => !!r),
        switchMap(r => this.dialogService.showNotImplementedDialog()),
        finalize(() => this.isSaving = false)
      )
      .subscribe();
  }

  addBlocker() {
    this.isSaving = true;
    this.dialogService
      .editBlocker(this.card.id)
      .pipe(
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(card => {
        this.card = card;
        this.update.emit(this.card.id);
      });
  }

  deleteCard() {
    this.isSaving = true;
    this.dialogService
      .confirmation('Are you sure you want to delete this card?')
      .pipe(
        filter(t => !!t),
        switchMap(() => this.cardEditorService.deleteCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(() => {
        this.delete.emit(this.card.id);
      });
  }

  deleteBlockerById(id: number) {
    this.isSaving = true;
    this.cardEditorService
      .removeBlocker(this.card.id, id)
      .pipe(
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false)
      )
      .subscribe(card => {
        this.card = card;
        this.update.emit(this.card.id);
      });
  }

  deleteBlocker() {
    const mainBlocker = this.card.blockers.find(b => b.blocker_id === this.card.blocker_id);
    this.deleteBlockerById(mainBlocker.id);
  }
}
