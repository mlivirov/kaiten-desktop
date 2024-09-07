import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbScrollSpy, NgbScrollSpyFragment } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { CardEx } from '../../models/card-ex';
import { CardStateLabelComponent } from '../../components/card-editor/card-state-label/card-state-label.component';
import { Router, RouterLink } from '@angular/router';
import { TimeagoModule } from 'ngx-timeago';
import { MemberType } from '../../models/member-type';
import { InlineMemberComponent } from '../../components/inline-member/inline-member.component';
import { finalize } from 'rxjs';
import { CardFilter, CardSearchService } from '../../services/card-search.service';


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
    NgbScrollSpyFragment
  ],
  templateUrl: './card-global-search.component.html',
  styleUrl: './card-global-search.component.scss'
})
export class CardGlobalSearchComponent {
  cards: CardEx[] = [];
  isLoading = false;
  offset = 0;
  limit = 10;
  filter: CardFilter;
  hasMore = false;

  @ViewChild('cardSearchInput')
  cardSearchInput: ElementRef;

  constructor(
    public modal: NgbActiveModal,
    private cardSearchService: CardSearchService,
    private router: Router
  ) {
    this.search(null);
  }

  search(filter: CardFilter) {
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

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput.nativeElement.focus();
    }
  }

  getResponsible(card: CardEx) {
    const responsible = card.members?.filter(t => t.type === MemberType.Responsible) || [];
    return responsible.length > 0 ? responsible[0] : null;
  }
}
