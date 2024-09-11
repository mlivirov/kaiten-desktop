import { Component, ElementRef, EventEmitter, Input, Output, Self } from '@angular/core';
import { TimeDotsComponent } from '../time-dots/time-dots.component';
import { JsonPipe, NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { CardEx } from '../../models/card-ex';
import { CardTransitionService } from '../../services/card-transition.service';
import { DialogService } from '../../services/dialog.service';
import { Owner } from '../../models/owner';
import { MemberType } from '../../models/member-type';
import { filter, finalize, map, Observable, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { getPastelColor } from '../../functions/pastel-color.function';
import { CopyToClipboardButtonComponent } from '../copy-to-clipboard-button/copy-to-clipboard-button.component';
import { Setting } from '../../models/setting';
import { formatCardLinkForClipboard } from '../../functions/format-card-link-for-clipboard.function';
import { SettingService } from '../../services/setting.service';
import { getLaneColor } from '../../functions/get-lane-color.function';
import { ServerCardEditorService } from '../../services/implementations/server-card-editor.service';
import { MdViewerComponent } from '../md-viewer/md-viewer.component';
import { FormsModule } from '@angular/forms';
import { TimeagoModule } from 'ngx-timeago';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    TimeDotsComponent,
    NgClass,
    NgIf,
    NgForOf,
    InlineMemberComponent,
    NgbTooltip,
    NgStyle,
    CopyToClipboardButtonComponent,
    MdViewerComponent,
    FormsModule,
    JsonPipe,
    NgbPopover,
    TimeagoModule,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input()
  card?: CardEx;

  @Input()
  disabled: boolean = false;

  @Output()
  updated: EventEmitter<CardEx> = new EventEmitter<CardEx>();

  @Output()
  open: EventEmitter<number> = new EventEmitter();

  active: boolean = false;

  highlight: boolean = false;

  clipboardLink$: Observable<string>;
  isSaving: boolean = false;
  isExtendedDataLoaded: boolean = false;
  isExtendedDataLoading: boolean = false;

  get assignedMembers(): Owner[] {
    if (!this.card?.members) {
      return [];
    }

    if (this.card.members.length === 1) {
      return this.card.members;
    }

    const responsible = this.card.members.filter(m => m.type === MemberType.Responsible);

    if (responsible.length > 0) {
      return responsible;
    }

    return this.card.members;
  }

  constructor(
    @Self() public elementRef: ElementRef,
    private dialogService: DialogService,
    private cardEditorService: ServerCardEditorService,
    private cardService: CardTransitionService,
    private router: Router,
    private settingService: SettingService,
  ) {
    this.clipboardLink$ = this.settingService
      .getSetting(Setting.ApiUrl)
      .pipe(
        map(baseUrl => formatCardLinkForClipboard(baseUrl, this.card))
      );
  }

  getBackgroundColor(): string {
    return getLaneColor(this.card.lane);
  }

  openCard(id: number) {
    this.open.emit(id);
  }

  transitionToNextColumn() {
    this.isSaving = true;
    this.cardService
      .getTransitionColumns(this.card)
      .pipe(
        switchMap(cols => {
          if (!cols) {
            return this.dialogService
              .alert('This card is already at the end of the current board.')
              .pipe(map(r => null))
          }

          return this.dialogService.cardTransition(this.card, cols.from, cols.to);
        }),
        finalize(() => this.isSaving = false),
        filter(r => !!r)
      )
      .subscribe(card => {
        this.card = card;
        this.updated.emit(card);
      });
  }

  addBlock() {
    this.isSaving = true;
    this.dialogService
      .editBlocker(this.card.id)
      .pipe(
        switchMap(() => this.cardEditorService.getCard(this.card.id)),
        finalize(() => this.isSaving = false),
      )
      .subscribe(card => {
        Object.assign(this.card, card);
      });
  }

  focus() {
    this.elementRef.nativeElement.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });

    this.highlight = true;
    setTimeout(() => this.highlight = false, 1000);
  }

  handleGoalsTooltipShown() {
    if (this.isExtendedDataLoaded || this.isExtendedDataLoading) {
      return;
    }
    this.isExtendedDataLoading = true;
    this.cardEditorService
      .getCard(this.card.id)
      .pipe(
        finalize(() => this.isExtendedDataLoading = false),
      )
      .subscribe(card => {
        Object.assign(this.card, card);
        this.isExtendedDataLoaded = true;
      })
  }
}
