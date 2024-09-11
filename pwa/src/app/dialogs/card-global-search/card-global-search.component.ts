import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbScrollSpy, NgbScrollSpyFragment, NgbScrollSpyItem } from '@ng-bootstrap/ng-bootstrap';
import { FileService } from '../../services/file.service';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';
import { JsonPipe, NgForOf, NgIf } from '@angular/common';
import { CardEx } from '../../models/card-ex';
import { CardStateLabelComponent } from '../../components/card-editor/card-state-label/card-state-label.component';
import { Router, RouterLink } from '@angular/router';
import { TimeagoModule } from 'ngx-timeago';
import { MemberType } from '../../models/member-type';
import { InlineMemberComponent } from '../../components/inline-member/inline-member.component';
import { finalize } from 'rxjs';
import { CardFilter, CardSearchService } from '../../services/card-search.service';

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
  ],
  templateUrl: './card-global-search.component.html',
  styleUrl: './card-global-search.component.scss'
})
export class CardGlobalSearchComponent {
  selected: {} = {};
  showSelected: boolean = false;
  cards: CardEx[] = [];
  isLoading = false;
  offset = 0;
  limit = 25;
  filter: CardFilter;
  hasMore = false;

  @Input()
  title: string;

  @Input()
  selectMode: CardSearchSelectMode = 'none';

  @ViewChild('cardSearchInput', { read: CardSearchInputComponent })
  cardSearchInput: CardSearchInputComponent;

  constructor(
    public modal: NgbActiveModal,
    private cardSearchService: CardSearchService,
    private router: Router
  ) {
    this.search(null);
  }

  search(filter: CardFilter) {
    if (this.showSelected) {
      this.showSelected = false;
    }

    if (this.selectMode === 'single') {
      Object.keys(this.selected).forEach(c => { delete this.selected[c]; });
    }

    this.filter = filter;
    this.offset = 0;
    this.isLoading = true;
    this.cardSearchService
      .searchCards(filter, this.offset, this.limit)
      .pipe(
        finalize(() => this.isLoading = false),
      )
      .subscribe(cards => {
        this.cards = cards;
        this.hasMore = cards.length >= this.limit;
      });
  }

  loadMore() {
    this.offset += this.limit;
    this.isLoading = true;
    this.cardSearchService
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

  openBoard(id: number) {
    this.modal.close();
    this.router.navigate(['/board', id]);
  }

  openCard(id: number) {
    this.modal.close();
    this.router.navigate(['/card', id]);
  }

  handleCardClick(card: CardEx) {
    if (this.selectMode === 'none') {
      this.openCard(card.id);
    } else {
      this.toggleSelected(card);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput?.typeahead.input.nativeElement.focus();
    }
  }

  getResponsible(card: CardEx) {
    const responsible = card.members?.filter(t => t.type === MemberType.Responsible) || [];
    return responsible.length > 0 ? responsible[0] : null;
  }

  toggleSelected(card: CardEx) {
    if (this.selectMode === 'single') {
      Object.keys(this.selected).forEach(c => { delete this.selected[c]; });
    }

    if (this.selected[card.id]) {
      delete this.selected[card.id];
    } else {
      this.selected[card.id] = card;
    }
  }

  toggleShowSelected(value: boolean) {
    if (value) {
      this.cards = Object.values(this.selected);
      this.showSelected = value;
    } else {
      this.showSelected = false;
      this.search(this.filter);
    }
  }

  continue() {
    this.modal.close(Object.values(this.selected));
  }

  getSelectedCount(): number {
    return Object.keys(this.selected).length;
  }
}
