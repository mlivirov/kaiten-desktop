import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CardFilter, CardSearchService } from '../../services/card-search.service';
import { CardSearchInputComponent } from '../card-search-input/card-search-input.component';
import { CardEx } from '../../models/card-ex';
import { CardComponent } from '../card/card.component';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, Subscription } from 'rxjs';
import { DragulaModule } from 'ng2-dragula';
import { ChangesNotificationService } from '../../services/changes-notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-list-of-cards',
  standalone: true,
  imports: [
    CardSearchInputComponent,
    CardComponent,
    NgForOf,
    FormsModule,
    NgIf,
    DragulaModule
  ],
  templateUrl: './list-of-cards.component.html',
  styleUrl: './list-of-cards.component.scss'
})
export class ListOfCardsComponent implements OnDestroy {
  protected searchFilter: CardFilter = {};
  protected cards: CardEx[] = [];
  protected isLoading: boolean = false;
  protected hasMore: boolean = false;
  @Output() protected openCard: EventEmitter<number> = new EventEmitter();
  private refreshSubscription: Subscription;
  private unsubscribe$: Subject<void> = new Subject();
  private currentOffset: number = 0;
  private readonly pageSize: number = 25;
  private readonly filterStorageKey = 'LIST_OF_CARDS_FILTER';

  public constructor(
    private cardSearchService: CardSearchService,
    private changesNotificationService: ChangesNotificationService,
  ) {
    const savedFiltersJson = localStorage.getItem(this.filterStorageKey);
    if (savedFiltersJson) {
      this.searchFilter = <CardFilter>JSON.parse(savedFiltersJson);
    }

    this.changesNotificationService.cardUpdated$.pipe(takeUntilDestroyed()).subscribe(card => this.handleCardUpdated(card));
    this.refresh();
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  protected loadMore(): void {
    this.refreshSubscription?.unsubscribe();
    this.currentOffset += this.pageSize;
    this.isLoading = true;
    this.refreshSubscription = this.cardSearchService
      .searchCards(this.searchFilter, this.currentOffset, this.pageSize)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(t => {
        this.cards.push(...t);
        this.hasMore = t.length === this.pageSize;
      });
  }

  protected handleSearchFilterChanged(filter: CardFilter): void {
    localStorage.setItem(this.filterStorageKey, JSON.stringify(filter));
    this.searchFilter = filter;
    this.refresh();
  }

  private checkCardMatchesFilters(card: CardEx): boolean {
    if (this.searchFilter?.board && this.searchFilter.board.id !== card.board_id) {
      return false;
    }

    if (this.searchFilter?.type && this.searchFilter.type.id !== card.type_id) {
      return false;
    }

    return true;
  }
  
  private handleCardUpdated(updatedCard: CardEx): void {
    const visibleCard = this.cards.find(t => t.id === updatedCard.id);

    if (visibleCard && !this.checkCardMatchesFilters(updatedCard)) {
      const indexToRemove = this.cards.indexOf(visibleCard);
      this.cards.splice(indexToRemove, 1);
    }
  }

  private refresh(): void {
    this.refreshSubscription?.unsubscribe();
    this.isLoading = true;
    this.cards = [];
    this.refreshSubscription = this.cardSearchService
      .searchCards(this.searchFilter, 0, this.pageSize)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(t => {
        this.cards = t;
        this.hasMore = t.length === this.pageSize;
        this.currentOffset = 0;
      });
  }
  
}
