import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  AsyncPipe,
  DatePipe,
  JsonPipe, NgClass,
  NgForOf,
  NgIf, NgStyle,
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
import { EditorPropertyTemplateDirective, PropertiesEditorComponent, } from '../properties-editor/properties-editor.component';
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
import { unionIfNotExists } from '../../functions/union-if-not-exists';
import { TextEditorComponent, TextEditorSaveEvent } from '../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';
import { CardState } from '../../models/card-state';
import { BoardService } from '../../services/board.service';
import { CardType } from '../../models/card-type';
import { SettingService } from '../../services/setting.service';
import {
  formatClientCardLinkForClipboard,
  formatKaitenCardLinkForClipboard
} from '../../functions/format-kaiten-card-link-for-clipboard';
import {
  CopyToClipboardButtonComponent,
  CopyToClipboardLinks
} from '../copy-to-clipboard-button/copy-to-clipboard-button.component';
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
    EditorPropertyTemplateDirective,
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
    NgStyle,
    NgClass,
  ],
  templateUrl: './card-editor.component.html',
  styleUrl: './card-editor.component.scss',
})
export class CardEditorComponent implements OnInit {
  @Input() public showHeader: boolean = true;
  @Input() public card: CardEx;
  @Input() public showComments: boolean = true;
  @Input() public showReferences: boolean = true;
  @Input() public alwaysEditable: boolean = false;
  @Input() public collapsableProperties: boolean = false;
  protected readonly CardState = CardState;
  protected isSaving: boolean = false;
  @ViewChild(CardListOfChecklistsComponent) protected cardListOfChecklists: CardListOfChecklistsComponent;
  @ViewChild(CardReferencesAccordionComponent) protected cardReferencesAccordionComponent: CardReferencesAccordionComponent;
  @Output() protected delete: EventEmitter<number> = new EventEmitter();
  @Output() protected update: EventEmitter<number> = new EventEmitter();
  protected isCollapsedProperties: boolean = false;
  protected cardTypes: CardType[] = [];
  protected clipboardLink$: Observable<CopyToClipboardLinks>;

  protected get propertiesHeight(): number {
    return window.outerHeight * 0.8;
  }

  public constructor(
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    private boardService: BoardService,
    private settingService: SettingService,
    private dialogService: DialogService
  ) {
    boardService.getCardTypes().subscribe(types => this.cardTypes = types);

    this.clipboardLink$ = this.settingService
      .getBaseUrl()
      .pipe(
        map(baseUrl => (<CopyToClipboardLinks>{
          kaiten: formatKaitenCardLinkForClipboard(baseUrl, this.card),
          client: formatClientCardLinkForClipboard(this.card)
        }))
      );
  }

  public ngOnInit(): void {
    if (this.collapsableProperties) {
      this.isCollapsedProperties = window.innerWidth < 768;
    }
  }

  protected updateAsap(value: boolean): void {
    this.updateCard({ asap: value }).subscribe();
  }

  protected addChecklist(): void {
    this.isSaving = true;
    this.cardEditorService
      .addCardCheckList(this.card.id, {
        name: `This is your ${this.card.checklists?.length ?? 1} checklist`,
      })
      .pipe(
        finalize(() => this.isSaving = false)
      )
      .subscribe(checklist => {
        this.card.checklists = unionIfNotExists(this.card.checklists, checklist, 'id');

        setTimeout(() => {
          this.cardListOfChecklists.openTextEditor(checklist.id);
        }, 1);
      });
  }

  protected saveType(type: CardType): void {
    this
      .updateCard({ type_id: type.id })
      .subscribe(() => {
        this.card.type = type;
      });
  }

  protected saveTitle(saveEvent: TextEditorSaveEvent): void {
    this
      .updateCard({ title: saveEvent.value })
      .subscribe(saveEvent.commit.bind(saveEvent));
  }

  protected saveDescription(saveEvent: TextEditorSaveEvent): void {
    this
      .updateCard({ description: saveEvent.value })
      .subscribe(saveEvent.commit.bind(saveEvent));
  }

  protected instantUpdateTitle(value: string): void {
    this.card.title = value;
    this.cardEditorService
      .updateCard(this.card.id, {
        title: this.card.title,
      })
      .subscribe();
  }

  protected instantUpdateDescription(value: string): void {
    this.card.description = value;
    this.cardEditorService
      .updateCard(this.card.id, {
        description: this.card.description,
      })
      .subscribe();
  }

  protected focusBlocker(): void {
    this.cardReferencesAccordionComponent?.focusByType('BLOCKER');
  }

  protected deleteParent(id: number): void {
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

  protected deleteChild(id: number): void {
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

  protected addParent(): void {
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

  protected addChild(): void {
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

  protected addRelated(): void {
    this.isSaving = true;
    this.dialogService
      .searchCard('single')
      .pipe(
        filter(r => !!r),
        switchMap(() => this.dialogService.showNotImplementedDialog()),
        finalize(() => this.isSaving = false)
      )
      .subscribe();
  }

  protected addBlocker(): void {
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

  protected deleteCard(): void {
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

  protected deleteBlockerById(id: number): void {
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

  protected deleteBlocker(): void {
    const mainBlocker = this.card.blockers.find(b => b.blocker_id === this.card.blocker_id);
    this.deleteBlockerById(mainBlocker.id);
  }

  private updateCard(data: Partial<CardEx>): Observable<void> {
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
  
}
