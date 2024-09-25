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
import {
  CopyToClipboardButtonComponent,
  CopyToClipboardLinks
} from '../copy-to-clipboard-button/copy-to-clipboard-button.component';
import {
  formatClientCardLinkForClipboard,
  formatKaitenCardLinkForClipboard
} from '../../functions/format-kaiten-card-link-for-clipboard';
import { SettingService } from '../../services/setting.service';
import { getLaneColor } from '../../functions/get-lane-color';
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
  @Input() public card?: CardEx;
  @Input() public disabled: boolean = false;
  @Output() protected updated: EventEmitter<CardEx> = new EventEmitter<CardEx>();
  @Output() protected openRequest: EventEmitter<number> = new EventEmitter();
  protected active: boolean = false;
  protected focused: boolean = false;
  protected clipboardLink$: Observable<CopyToClipboardLinks>;
  protected isSaving: boolean = false;
  protected isExtendedDataLoaded: boolean = false;
  protected isExtendedDataLoading: boolean = false;

  protected get assignedMembers(): Owner[] {
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

  public constructor(
    @Self() public elementRef: ElementRef,
    private dialogService: DialogService,
    private cardEditorService: ServerCardEditorService,
    private cardService: CardTransitionService,
    private router: Router,
    private settingService: SettingService,
  ) {
    this.clipboardLink$ = this.settingService
      .getBaseUrl()
      .pipe(
        map(baseUrl => (<CopyToClipboardLinks>{
          kaiten: formatKaitenCardLinkForClipboard(baseUrl, this.card),
          client: formatClientCardLinkForClipboard(this.card)
        }))
      );
  }

  public unfocus(): void {
    this.focused = false;
  }

  public focus(): void {
    this.elementRef.nativeElement.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });

    this.focused = true;
  }

  protected getBackgroundColor(): string {
    return getLaneColor(this.card.lane);
  }

  protected openCard(id: number): void {
    this.openRequest.emit(id);
  }

  protected transitionToNextColumn(): void {
    this.isSaving = true;
    this.cardService
      .getTransitionColumns(this.card)
      .pipe(
        switchMap(cols => {
          if (!cols) {
            return this.dialogService
              .alert('This card is already at the end of the current board.')
              .pipe(map(() => null));
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

  protected addBlock(): void {
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

  protected handleGoalsTooltipShown(): void {
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
      });
  }
}
