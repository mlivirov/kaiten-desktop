import { Component, HostListener, Input, ViewChild } from '@angular/core';
import {
  NgbActiveModal,
  NgbScrollSpy,
  NgbScrollSpyFragment,
  NgbScrollSpyItem,
  NgbTooltip
} from '@ng-bootstrap/ng-bootstrap';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';
import { JsonPipe, NgForOf, NgIf } from '@angular/common';
import { CardEx } from '../../models/card-ex';
import { CardStateLabelComponent } from '../../components/card-editor/card-state-label/card-state-label.component';
import { Router, RouterLink } from '@angular/router';
import { TimeagoModule } from 'ngx-timeago';
import { MemberType } from '../../models/member-type';
import { InlineMemberComponent } from '../../components/inline-member/inline-member.component';
import { finalize, Subscription } from 'rxjs';
import { CardFilter, CardSearchService } from '../../services/card-search.service';
import { getTextOrDefault } from '../../functions/get-text-or-default';
import { Owner } from '../../models/owner';
import { getCardStateByCard } from '../../functions/get-card-state';
import { getCardColumnTitle } from '../../functions/get-card-column-title';

export type CardSearchSelectMode = 'single'|'multiple'|'none';

@Component({
  selector: 'app-card-global-search',
  standalone: true,
  imports: [
    CardSearchInputComponent,
    FormsModule,
    NgForOf,
    CardStateLabelComponent,
    NgIf,
    RouterLink,
    TimeagoModule,
    InlineMemberComponent,
    NgbScrollSpy,
    NgbScrollSpyFragment,
    JsonPipe,
    NgbScrollSpyItem,
    NgbTooltip,
  ],
  templateUrl: './card-global-search.component.html',
  styleUrl: './card-global-search.component.scss'
})
export class CardGlobalSearchComponent {
  @Input() public title: string;
  @Input() public selectMode: CardSearchSelectMode = 'none';
  protected readonly getCardStateByCard = getCardStateByCard;
  protected readonly getTextOrDefault = getTextOrDefault;
  protected selected: Record<number, CardEx> = {};
  protected showSelected: boolean = false;
  protected cards: CardEx[] = [];
  protected isLoading = false;
  protected filter: CardFilter;
  protected hasMore = false;
  @ViewChild('cardSearchInput', { read: CardSearchInputComponent }) protected cardSearchInput: CardSearchInputComponent;
  protected readonly getCardColumnTitle = getCardColumnTitle;
  private offset = 0;
  private readonly limit = 25;
  private searchSubscription: Subscription;

  public constructor(
    public modal: NgbActiveModal,
    private cardSearchService: CardSearchService,
    private router: Router
  ) {
    this.search(null);
  }

  protected search(filter: CardFilter): void {
    if (this.showSelected) {
      this.showSelected = false;
    }

    if (this.selectMode === 'single') {
      Object.keys(this.selected).forEach(c => { delete this.selected[c]; });
    }

    this.filter = filter;
    this.offset = 0;
    this.isLoading = true;

    this.searchSubscription?.unsubscribe();
    this.searchSubscription = this.cardSearchService
      .searchCards(filter, this.offset, this.limit)
      .pipe(
        finalize(() => this.isLoading = false),
      )
      .subscribe(cards => {
        this.cards = cards;
        this.hasMore = cards.length >= this.limit;
      });
  }

  protected loadMore(): void {
    this.offset += this.limit;
    this.isLoading = true;
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = this.cardSearchService
      .searchCards(this.filter, this.offset, this.limit)
      .pipe(
        finalize(() => this.isLoading = false),
      )
      .subscribe(cards => {
        this.cards.push(...cards);

        if (cards.length === 0) {
          this.hasMore = false;
        }
      });
  }

  protected openBoard(id: number): void {
    this.modal.close();
    this.router.navigate(['/board', id]);
  }

  protected openCard(id: number): void {
    this.modal.close();
    this.router.navigate(['/card', id]);
  }

  protected handleCardClick(card: CardEx): void {
    if (this.selectMode === 'none') {
      this.openCard(card.id);
    } else {
      this.toggleSelected(card);
    }
  }

  protected getResponsible(card: CardEx): Owner {
    const responsible = card.members?.filter(t => t.type === MemberType.Responsible) || [];
    return responsible.length > 0 ? responsible[0] : null;
  }

  protected toggleSelected(card: CardEx): void {
    if (this.selectMode === 'single') {
      Object.keys(this.selected).forEach(c => { delete this.selected[c]; });
    }

    if (this.selected[card.id]) {
      delete this.selected[card.id];
    } else {
      this.selected[card.id] = card;
    }
  }

  protected toggleShowSelected(value: boolean): void {
    if (value) {
      this.cards = Object.values(this.selected);
      this.showSelected = value;
    } else {
      this.showSelected = false;
      this.search(this.filter);
    }
  }

  protected continue(): void {
    this.modal.close(Object.values(this.selected));
  }

  protected getSelectedCount(): number {
    return Object.keys(this.selected).length;
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput?.focus();
    }
  }
  
}
