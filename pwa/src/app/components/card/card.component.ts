import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, Self, SimpleChanges } from '@angular/core';
import { TimeDotsComponent } from './time-dots/time-dots.component';
import { DatePipe, JsonPipe, NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
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
  formatCardLinkTitle,
  formatClientCardLinkForClipboard,
  formatKaitenCardLinkForClipboard
} from '../../functions/format-kaiten-card-link-for-clipboard';
import { SettingService } from '../../services/setting.service';
import { getLaneColor } from '../../functions/get-lane-color';
import { ServerCardEditorService } from '../../services/implementations/server-card-editor.service';
import { MdViewerComponent } from '../md-viewer/md-viewer.component';
import { FormsModule } from '@angular/forms';
import { TimeagoModule } from 'ngx-timeago';
import { TimespanPipe } from '../../pipes/timespan.pipe';
import { ElapsedPipe } from '../../pipes/elapsed.pipe';
import { TimeBadgeComponent } from './time-badge/time-badge.component';
import { nameof } from '../../functions/name-of';

export type CardComponentButtons = 'copy'|'move'|'block';
export type CardComponentStyles = 'colored'|'list-item'|'time-dots'|'time-badges';

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
    TimespanPipe,
    ElapsedPipe,
    DatePipe,
    TimeBadgeComponent,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnChanges {
  @Input() public card?: CardEx;
  @Input() public disabled: boolean = false;
  @Input() public buttons: CardComponentButtons[] = ['copy', 'move', 'block'];
  @Input() public showTimeDots: boolean = true;
  @Input() public cardStyle: CardComponentStyles[] = ['colored', 'time-dots'];
  @Output() protected updated: EventEmitter<CardEx> = new EventEmitter<CardEx>();
  @Output() protected openRequest: EventEmitter<number> = new EventEmitter();
  protected active: boolean = false;
  protected focused: boolean = false;
  protected clipboardLink$: Observable<CopyToClipboardLinks>;
  protected isSaving: boolean = false;
  protected isExtendedDataLoaded: boolean = false;
  protected isExtendedDataLoading: boolean = false;
  protected assignedMembers: Owner[] = [];
  protected responsibleMember: Owner;
  protected areMembersCollapsed: boolean = true;

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
          client: formatClientCardLinkForClipboard(this.card),
          title: formatCardLinkTitle(this.card)
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
    if (this.cardStyle.includes('colored')) {
      return getLaneColor(this.card.lane);
    }

    return '';
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

  private updateAssignedMembers(): void {
    this.assignedMembers = [];
    if (!this.card?.members) {
      return;
    }

    if (this.card.members.length === 1) {
      this.assignedMembers = this.card.members;
      return;
    }

    this.responsibleMember = this.card.members.find(t => t.type === MemberType.Responsible);
    this.assignedMembers = [...this.card.members];
    this.assignedMembers.sort((a, b) => b.type - a.type || a.full_name.localeCompare(b.full_name));
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardComponent>('card')]) {
      this.updateAssignedMembers();
    }
  }

  protected readonly MemberType = MemberType;
}
