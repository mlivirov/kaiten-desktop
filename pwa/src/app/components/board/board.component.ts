import {
  AfterViewInit,
  Component, ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit, Self,
  SimpleChanges
} from '@angular/core';
import { JsonPipe, NgClass, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { CardEx } from '../../models/card-ex';
import { ApiService } from '../../services/api.service';
import { finalize, from, map, Observable, of, Subject, switchMap, takeUntil, tap, zip } from 'rxjs';
import { User } from '../../models/user';
import { ColumnEx } from '../../models/column-ex';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { DragulaModule, DragulaService } from 'ng2-dragula';
import { BoardService } from '../../services/board.service';
import { DialogService } from '../../services/dialogService';
import { CardFilter } from '../card-search-input/card-search-input.component';
import { FindColumnRecursiveFunction } from '../../functions/find-column-recursive.function';
import { ActivatedRoute, Params } from '@angular/router';

function colSortPredicate(a, b) {
  if (a.sort_order < b.sort_order) {
    return -1;
  } else if (a.sort_order > b.sort_order) {
    return 1;
  }

  return 0;
}

class BoardViewColumn {
  columns: ColumnEx[];
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
    NgbTooltip,
    DragulaModule
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  spaceId: number;

  @Input()
  boardId: number;

  @Input()
  columns: ColumnEx[];

  @Input()
  cards: CardEx[];

  filterValue?: CardFilter;
  currentUser?: User;
  viewColumns: BoardViewColumn[];

  isBoardLoading: boolean = false;
  hideEmpty: boolean = false;
  cardsByColumnId: { [key: number]: CardEx[] } = {};
  cardsCountByRootColumnId: { [key: number]: number } = {};

  customColumns: number[][] = [];

  unsubscribe$: Subject<void> = new Subject();

  constructor(
    private apiService: ApiService,
    private dragulaService: DragulaService,
    private boardService: BoardService,
    private dialogService: DialogService,
    private activatedRoute: ActivatedRoute,
    @Self()
    private elementRef: ElementRef
  ) {
    const cardDragBag = dragulaService.createGroup('CARD', {
      moves: (el, container, handle) => {
        return !!el.getAttribute('data-card-id') && Math.min(window.outerWidth, window.outerHeight) > 540;
      },
      accepts: (el, target, source) => {
        const targetId = Number.parseInt(target.getAttribute('data-column-id'));
        const sourceId = Number.parseInt(source.getAttribute('data-column-id'));

        return sourceId !== targetId;
      },
    });

    dragulaService.drop('CARD')
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(({name, el, target, source}) => {
          const targetId = Number.parseInt(target.getAttribute('data-column-id'));
          const sourceId = Number.parseInt(source.getAttribute('data-column-id'));
          const cardId = Number.parseInt(el.getAttribute('data-card-id'));

          cardDragBag.drake.cancel(true);
          return this.moveCardToColumn(cardId, sourceId, targetId);
        })
      )
      .subscribe();

    this.unsubscribe$.subscribe(() => {
      dragulaService.destroy('CARD');
    });

    dragulaService.createGroup('COLUMN', {
      removeOnSpill: true,
      moves: (el, container, handle) => {
        return (handle.parentElement.classList.contains('column-title')
                  || handle.classList.contains('column-title'))
                && Math.min(window.outerWidth, window.outerHeight) > 540;
      },
      accepts: (el, target, source) => {
        const targetIndex = Number.parseInt(target.getAttribute('data-view-column-index'));
        const sourceIndex = Number.parseInt(source.getAttribute('data-view-column-index'));

        return Math.abs(targetIndex - sourceIndex) === 1;
      }
    });

    this.unsubscribe$.subscribe(() => {
      dragulaService.destroy('COLUMN');
    });


    dragulaService
      .drop('COLUMN')
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(({el, target, source}) => {
          const targetIndex = Number.parseInt(target.getAttribute('data-view-column-index'))
          const sourceIndex = Number.parseInt(source.getAttribute('data-view-column-index'))
          const elIndex = Number.parseInt(el.getAttribute('data-column-index'));

          return this.updateColumnsArrangement(targetIndex, sourceIndex, elIndex);
        })
      )
      .subscribe();

    dragulaService.remove('COLUMN')
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(({el, source}) => {
          const sourceIndex = Number.parseInt(source.getAttribute('data-view-column-index'))
          const elIndex = Number.parseInt(el.getAttribute('data-column-index'));

          return this.updateColumnsArrangement(null, sourceIndex, elIndex);
        })
      )
      .subscribe()
  }

  ngOnInit(): void {
    this.apiService.getCurrentUser().subscribe(t => this.currentUser = t);
  }

  handleFilter(value?: CardFilter) {
    this.filterValue = value;
    this.mapCardsByColumnId(this.cards);
  }

  moveCardToColumn(cardId: number, fromId: number, toId: number): Observable<void> {
    const card = this.cards.find(t => t.id === cardId);
    const from = FindColumnRecursiveFunction(this.columns, fromId);
    const to = FindColumnRecursiveFunction(this.columns, toId);

    return this.dialogService.cardTransition(card, from, to)
      .pipe(
        tap(card => {
          this.refresh(true);
        }),
        map(() => {})
      );
  }

  updateColumnsArrangement(targetIndex: number|null, sourceIndex: number, colIndex: number): Observable<void> {
    const column: ColumnEx = this.viewColumns[sourceIndex].columns[colIndex];
    const currentCustomGroup = this.customColumns.find(g => g.indexOf(column.id) !== -1);

    if (targetIndex !== null) {
      const targetSiblingColumn: ColumnEx|null = this.viewColumns[targetIndex].columns[0];
      const targetCustomGroup = this.customColumns.find(g => g.indexOf(targetSiblingColumn.id) !== -1);

      if (!targetCustomGroup) {
        this.customColumns.push([
          column.id,
          targetSiblingColumn.id
        ]);

      } else {
        targetCustomGroup.push(column.id);
      }
    }

    if (currentCustomGroup) {
      currentCustomGroup.splice(currentCustomGroup.indexOf(column.id), 1);

      if (currentCustomGroup.length === 0) {
        this.customColumns.splice(this.customColumns.indexOf(currentCustomGroup), 1);
      }
    }

    this.rearrangeColumns();

    return this.boardService.setCustomColumns(this.boardId, this.customColumns);
  }

  rearrangeColumns() {
    this.viewColumns = [];

    for (const col of this.columns) {
      const requiresCustomization = this.customColumns.reduce((a, i) => [...a, ...i], []).some(t => t === col.id);
      if (requiresCustomization) {
        const customGroup = this.customColumns.find(t => t.some(c => c === col.id));

        const existingViewColumn = this.viewColumns.find(t => t.columns.map(c => c.id).some(c => customGroup.indexOf(c) != -1));
        if (existingViewColumn) {
          existingViewColumn.columns.push(col);
        } else {
          this.viewColumns.push(<BoardViewColumn>{
            columns: [col],
          });
        }
      } else {
        this.viewColumns.push(<BoardViewColumn>{
          columns: [col],
        });
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

      const hasMembers = this.filterValue?.members?.length
        ? this.filterValue.members.some(member => card.members.map(t => t.id).includes(member.id))
        : null;

      const hasOwners = this.filterValue?.owners?.length
        ? this.filterValue?.owners?.some(owner => card.owner_id === owner.id)
        : null;

      const hasTags = this.filterValue?.tags?.length
        ? this.filterValue?.tags?.some(tag => card.tag_ids.includes(tag.id))
        : null;

      const hasText = this.filterValue?.text
        ? card.title.toLowerCase().indexOf(this.filterValue.text?.toLowerCase()) !== -1 || `${card.id}`.indexOf(this.filterValue.text) !== -1
        : null;

      if (
        (hasMembers === true || hasMembers === null)
        && (hasOwners === true || hasOwners === null)
        && (hasTags === true || hasTags === null)
        && (hasText === true || hasText === null)
      ) {
        cards.push(card);
      }
    }

    this.cardsByColumnId = cardsByColumnId;
  }

  refresh(pullData: boolean) {
    if (this.isBoardLoading) {
      return;
    }

    this.isBoardLoading = true;
    zip(
      pullData ? this.apiService.getColumns(this.boardId) : of(this.columns),
      pullData ? this.apiService.getCards(this.boardId) : of(this.cards),
      this.boardService.getCustomColumns(this.boardId),
      this.activatedRoute.queryParams.pipe(map((params: Params) => { return params['cardId']})),
    )
      .pipe(
        finalize(() => this.isBoardLoading = false)
      )
      .subscribe(([columns, cards, customColumns, activeCardId]) => {
        this.columns = columns;
        this.cards = cards;
        this.customColumns = customColumns;

        this.mapCardsByColumnId(this.cards);
        this.sortColumns();
        this.rearrangeColumns();
        this.countCards();

        if (activeCardId) {
          setTimeout(() => {
            const cardElement = (this.elementRef.nativeElement as HTMLElement).querySelector(`[data-card-id="${activeCardId}"]`) as HTMLElement;
            cardElement.scrollIntoView({
              block: 'center'
            });
          }, 1);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards'].currentValue && changes['columns']?.currentValue) {
      this.refresh(false)
    } else if (changes['boardId']) {
      this.refresh(true);
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

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
