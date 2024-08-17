import { Component, HostListener, Input, OnInit, SimpleChanges } from '@angular/core';
import { JsonPipe, NgClass, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { CardEx } from '../../models/card-ex';
import { ApiService } from '../../services/api.service';
import { finalize, zip } from 'rxjs';
import { User } from '../../models/user';
import { ColumnEx } from '../../models/column-ex';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

function colSortPredicate(a, b) {
  if (a.sort_order < b.sort_order) {
    return -1;
  } else if (a.sort_order > b.sort_order) {
    return 1;
  }

  return 0;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgClass,
    NgForOf,
    CardComponent,
    NgTemplateOutlet,
    NgIf,
    JsonPipe,
    NgbTooltip
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit {
  @Input()
  spaceId: number;

  @Input()
  boardId: number;

  filterTerm?: string;
  currentUser?: User;
  columns: ColumnEx[];
  cards: CardEx[];

  isBoardLoading: boolean = false;
  hideEmpty: boolean = false;
  cardsByColumnId: { [key: number]: CardEx[] } = {};
  cardsCountByRootColumnId: { [key: number]: number } = {};

  customColumns = [
      {
        title: 'Analysis',
        after: null,
        children: [
          'Waiting for Analysis',
          'Analyzing',
        ]
      },
      {
        title: 'Completion',
        after: 'Testing',
        children: [
          'Done',
          'To Demo'
        ]
      }
  ];

  constructor(
    private apiService: ApiService
  ) {
  }

  ngOnInit(): void {
    this.apiService.getCurrentUser().subscribe(t => this.currentUser = t);
  }

  filter(value?: string) {
    this.filterTerm = value;
    this.mapCardsByColumnId(this.cards);
  }

  rearrangeColumns() {
    const customColumns = this.customColumns;

    for (const customCol of customColumns) {
      const afterIndex = this.columns.findIndex(col => col.title === customCol.after);
      if (afterIndex === -1) {
        continue;
      }

      const newCol: ColumnEx = {
        id: 999 + this.columns.length + 1,
        title: customCol.title,
        subcolumns: [],
      } as ColumnEx;

      for (const child of customCol.children) {
        const movedIndex = this.columns.findIndex(col => col.title === child)
        if (movedIndex === -1) {
          continue;
        }

        const colsToMove = [];

        if (this.columns[movedIndex].subcolumns) {
          colsToMove.push(...this.columns[movedIndex].subcolumns!);
        } else {
          colsToMove.push(this.columns[movedIndex]);
        }

        newCol.subcolumns.push(...colsToMove);
        this.columns.splice(movedIndex, 1);
      }

      if (newCol.subcolumns.length) {
        this.columns.splice(afterIndex + 1, 0, newCol);
      }
    }
  }

  sortColumns() {
    for (const col of this.columns) {
      if (!col.subcolumns?.length) {
        continue;
      }

      col.subcolumns!.sort(colSortPredicate)
    }

    this.columns.sort(colSortPredicate);
  }

  mapCardsByColumnId(cards: CardEx[]) {
    const cardsByColumnId: { [key: number]: CardEx[] } = {};
    for (let card of cards) {
      let cards = cardsByColumnId[card.column_id];
      if (!cards) {
        cards = [];
        cardsByColumnId[card.column_id] = cards;
      }

      if (!this.filterTerm) {
        cards.push(card);
      } else if (this.filterTerm === '@me' && card.members?.filter(m => m.uid === this.currentUser?.uid).length > 0)
      {
        cards.push(card)
      } else if (card.title.toLowerCase().indexOf(this.filterTerm.toLowerCase()) !== -1 || `${card.id}`.indexOf(this.filterTerm) !== -1) {
        cards.push(card)
      }
    }

    this.cardsByColumnId = cardsByColumnId;
  }

  refresh() {
    if (this.isBoardLoading) {
      return;
    }

    this.isBoardLoading = true;
    zip(
      this.apiService.getColumns(this.boardId),
      this.apiService.getCards(this.boardId)
    )
      .pipe(
        finalize(() => this.isBoardLoading = false)
      )
      .subscribe(([columns, cards]) => {
        this.columns = columns;
        this.cards = cards;

        this.mapCardsByColumnId(cards);
        this.rearrangeColumns();
        this.sortColumns();
        this.countCards();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.boardId) {
      this.refresh();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyH' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.hideEmpty = !this.hideEmpty;
    }
  }

  private countCards() {
    this.cardsCountByRootColumnId = {};
    for (const card of this.cards) {
      for (const column of this.columns) {
        if (this.cardsCountByRootColumnId[column.id] === undefined) {
          this.cardsCountByRootColumnId[column.id] = 0;
        }

        if (card.column_id === column.id) {
          this.cardsCountByRootColumnId[column.id]++;
          break;
        }

        for (const subcolumn of column.subcolumns || []) {
          if (card.column_id === subcolumn.id) {
            this.cardsCountByRootColumnId[column.id]++;
            break;
          }
        }
      }
    }
  }
}
