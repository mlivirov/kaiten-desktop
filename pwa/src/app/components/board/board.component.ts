import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  Self,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { JsonPipe, NgClass, NgForOf, NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import { CardComponent } from '../card/card.component';
import { CardEx } from '../../models/card-ex';
import { filter, finalize, Observable, of, Subject, switchMap, takeUntil, zip } from 'rxjs';
import { User } from '../../models/user';
import { ColumnEx } from '../../models/column-ex';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { DragulaModule, DragulaService } from 'ng2-dragula';
import { BoardService } from '../../services/board.service';
import { DialogService } from '../../services/dialog.service';
import { findColumnRecursive } from '../../functions/find-column-recursive';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CardFilter, CardSearchService } from '../../services/card-search.service';
import { Board } from '../../models/board';
import { WipLimitType } from '../../models/wip-limit-type';
import { getTextOrDefault } from '../../functions/get-text-or-default';
import { nameof } from '../../functions/name-of';
import { ServerCardEditorService } from '../../services/implementations/server-card-editor.service';
import { getLaneColor } from '../../functions/get-lane-color';
import { AutosizeModule } from 'ngx-autosize';
import { ReactiveFormsModule } from '@angular/forms';
import { ChangesNotificationService } from '../../services/changes-notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Lane } from '../../models/lane';
import { flattenColumns } from '../../functions/flatten-columns';

// TODO: extract into separate function
function colSortPredicate(a, b): number {
  return a.sort_order - b.sort_order;
}

export enum BoardStyle {
  Vertical = 'Vertical',
  HorizontalCollapsible = 'HorizontalCollapsible',
}

interface BoardViewColumn {
  columns: ColumnEx[];
}

interface CardPlaceholder {
  columnId: number,
  cardId: number,
  siblingCardId?: number,
  targetLaneId?: number,
  items: BoardItem[],
}

interface BoardItem {
  card?: CardEx,
  placeholder?: CardPlaceholder,
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
    DragulaModule,
    NgStyle,
    NgbPopover,
    AutosizeModule,
    ReactiveFormsModule
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public columns: ColumnEx[];
  @Input() public cards: CardEx[];
  @Input() public board: Board;
  @Input() public boardStyle?: BoardStyle;
  @ViewChild('droppedCardPopover', { read: NgbPopover }) protected droppedCardPopover: NgbPopover;
  @ViewChildren(CardComponent) protected cardComponents: QueryList<CardComponent> = new QueryList();
  @Output() protected openCard: EventEmitter<number> = new EventEmitter();
  @Output() protected loaded: EventEmitter<void> = new EventEmitter();
  protected readonly getTextOrDefault = getTextOrDefault;
  protected readonly getLaneColor = getLaneColor;
  protected readonly BoardStyle = BoardStyle;
  protected currentBoardStyle: BoardStyle;
  protected currentUser?: User;
  protected lanesById: Record<number, Lane> = {};
  protected boardItemsByColumnId: Record<number, BoardItem[]> = {};
  protected boardItemsByLaneId: Record<number, BoardItem[]> = {};
  protected viewColumns: BoardViewColumn[];
  protected hideEmpty: boolean = false;
  protected cardsCountByRootColumnId: Record<number, number> = {};
  protected cardsCountByColumnId: Record<number, number> = {};
  protected collapsedColumns: Record<number, boolean> = {};
  private filterValue?: CardFilter;
  private isBoardLoading: boolean = false;
  private cardsSizeByRootColumnId: Record<number, number> = {};
  private customColumns: number[][] = [];
  private unsubscribe$: Subject<void> = new Subject();
  private focusedCardComponent?: CardComponent;

  public constructor(
    private authService: AuthService,
    private dragulaService: DragulaService,
    private boardService: BoardService,
    private cardSearchService: CardSearchService,
    private dialogService: DialogService,
    private activatedRoute: ActivatedRoute,
    private cardEditorService: ServerCardEditorService,
    private changesNotificationService: ChangesNotificationService,
    @Self() private elementRef: ElementRef
  ) {
    this.changesNotificationService
      .cardUpdated$
      .pipe(
        takeUntilDestroyed(),
        filter(card => this.cards.some(t => t.id === card.id) || card.board_id === this.board.id)
      )
      .subscribe(card => this.handleCardUpdated(card));

    this.changesNotificationService
      .cardCreated$
      .pipe(
        takeUntilDestroyed(),
        filter(card => card.board_id === this.board.id)
      )
      .subscribe(card => this.handleCardCreated(card));

    this.updateCurrentBoardStyle();
  }

  public ngOnInit(): void {
    this.initCardDragBag();
    this.initColumnDragBag();
    this.updateCurrentBoardStyle();
    this.rearrangeColumns();
    this.authService.getCurrentUser().subscribe(t => this.currentUser = t);
  }

  public applyFilter(value?: CardFilter): void {
    this.filterValue = value;
    this.mapCardsByColumnId(this.cards);
    this.mapCardsByLaneId(this.cards);
  }

  public focusCard(cardId: number): void {
    const card = this.cards.find(t => t.id === cardId);
    if (!card) {
      return;
    }

    if (this.collapsedColumns[card.column_id]) {
      this.toggleColumnCollapsed(card.column_id);
      setTimeout(() => {
        this.doFocusCard(cardId);
      }, 1);
    } else {
      this.doFocusCard(cardId);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<BoardComponent>('cards')]?.currentValue && changes[nameof<BoardComponent>('columns')]?.currentValue) {
      this.refresh(false);
    } else if (changes[nameof<BoardComponent>('boardStyle')]) {
      this.updateCurrentBoardStyle();
      this.refresh(false);
    }
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  protected refresh(pullData: boolean = false): void {
    if (this.isBoardLoading) {
      return;
    }

    this.isBoardLoading = true;
    let data$ = zip(
      pullData ? this.boardService.getColumns(this.board.id) : of(this.columns),
      pullData ? this.cardSearchService.searchCards({ board: this.board }) : of(this.cards),
      this.boardService.getCustomColumns(this.board.id),
      this.boardService.getCollapsedColumns(this.board.id),
    )
      .pipe(
        finalize(() => this.isBoardLoading = false)
      );

    if (pullData) {
      data$ = this.dialogService.loadingDialog(data$, 'Refreshing the board...');
    }

    data$
      .subscribe(([columns, cards, customColumns, collapsedColumns]) => {
        this.columns = columns;
        this.cards = cards?.filter(c => !c.archived);
        this.customColumns = customColumns;
        this.collapsedColumns = collapsedColumns;

        this.mapLanesById();
        this.mapCardsByColumnId(this.cards);
        this.mapCardsByLaneId(this.cards);
        this.sortColumns();
        this.rearrangeColumns();
        this.countCards();

        this.loaded.emit();
      });
  }

  protected getColumnLimitFulfillment(columnId: number, limitType: WipLimitType): number {
    if (limitType === WipLimitType.Size) {
      return this.cardsSizeByRootColumnId[columnId];
    }

    return this.cardsCountByRootColumnId[columnId];
  }

  protected toggleRootColumnCollapsed(column: ColumnEx): void {
    if (this.currentBoardStyle !== BoardStyle.HorizontalCollapsible) {
      return;
    }

    this.collapsedColumns[column.id] = !this.collapsedColumns[column.id];

    column.subcolumns?.forEach((subcolumn) => {
      this.collapsedColumns[subcolumn.id] = this.collapsedColumns[column.id];
    });

    this.boardService.setCollapsedColumns(this.board.id, this.collapsedColumns).subscribe();
  }

  protected toggleColumnCollapsed(columnId: number): void {
    if (this.currentBoardStyle !== BoardStyle.HorizontalCollapsible) {
      return;
    }

    if (this.currentBoardStyle !== BoardStyle.HorizontalCollapsible) {
      return;
    }

    this.collapsedColumns[columnId] = !this.collapsedColumns[columnId];
    this.boardService.setCollapsedColumns(this.board.id, this.collapsedColumns).subscribe();
  }

  protected checkViewColumnCollapsed(viewColumnIndex: number): boolean {
    return this.viewColumns[viewColumnIndex].columns.every(c => this.checkAllSubColumnsCollapsed(c));
  }

  protected checkAllSubColumnsCollapsed(column: ColumnEx): boolean {
    return !!column.subcolumns?.map(t => t.id).every(t => this.collapsedColumns[t]) || (!column.subcolumns && this.collapsedColumns[column.id]);
  }

  protected moveCardToBoard(placeholder: CardPlaceholder): void {
    this.removeDroppedCardPlaceholder(placeholder);

    const sortOrder = this.getSortOrder(placeholder);
    const updatedCard$ = this.cardEditorService
      .updateCard(placeholder.cardId, {
        board_id: this.board.id,
        column_id: placeholder.columnId,
        lane_id: placeholder.targetLaneId,
        sort_order: sortOrder,
      });

    this.dialogService
      .loadingDialog(updatedCard$, 'Updating a card, please wait...')
      .subscribe();
  }

  protected removeDroppedCardPlaceholder(placeholder: CardPlaceholder): void {
    const indexToDelete = placeholder.items.findIndex(t => t.placeholder === placeholder);
    if (indexToDelete !== -1) {
      placeholder.items.splice(indexToDelete, 1);
    }
  }

  protected createChild(placeholder: CardPlaceholder): void {
    this.removeDroppedCardPlaceholder(placeholder);

    const sortOrder = this.getSortOrder(placeholder);
    this.dialogService
      .loadingDialog(this.cardEditorService.getCard(placeholder.cardId), 'Getting things ready...')
      .pipe(
        switchMap(card => this.dialogService.createCard({
          board_id: this.board.id,
          type_id: this.board.default_card_type_id,
          column_id: placeholder.columnId,
          title: `Child of card ${placeholder.cardId} - ${card.title}`,
          sort_order: sortOrder,
          lane_id: placeholder.targetLaneId
        })),
        switchMap(childId => this.dialogService.loadingDialog(this.cardEditorService.addRelation(placeholder.cardId, childId), 'Linking card to parent, please wait...'))
      )
      .subscribe();
  }

  private handleCardCreated(createdCard: CardEx): void {
    this.cards.push(createdCard);
    this.refresh(false);
  }
  
  private handleCardUpdated(updatedCard: CardEx): void {
    const card = this.cards.find(t => t.id === updatedCard.id);

    if (updatedCard.board_id !== this.board.id) {
      const indexToDelete = this.cards.findIndex(t => t.id === updatedCard.id);
      this.cards.splice(indexToDelete, 1);
    } else if (card) {
      Object.assign(card, updatedCard);
    } else {
      this.cards.push(updatedCard);
    }

    this.refresh(false);
  }

  private initColumnDragBag(): void {
    this.dragulaService.createGroup('COLUMN', {
      removeOnSpill: true,
      moves: (el, container, handle) => {
        return (handle.closest('.column-title'))
          && Math.min(window.outerWidth, window.outerHeight) > 540
          && this.currentBoardStyle === BoardStyle.Vertical;
      },
      accepts: (el, target, source) => {
        const targetIndex = Number.parseInt(target.getAttribute('data-view-column-index'));
        const sourceIndex = Number.parseInt(source.getAttribute('data-view-column-index'));

        return Math.abs(targetIndex - sourceIndex) === 1;
      },
    });

    this.unsubscribe$.subscribe(() => {
      this.dragulaService.destroy('COLUMN');
    });

    this.dragulaService
      .drop('COLUMN')
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(({el, target, source}) => {
          const targetIndex = Number.parseInt(target.getAttribute('data-view-column-index'));
          const sourceIndex = Number.parseInt(source.getAttribute('data-view-column-index'));
          const elIndex = Number.parseInt(el.getAttribute('data-column-index'));

          return this.updateColumnsArrangement(targetIndex, sourceIndex, elIndex);
        })
      )
      .subscribe();

    this.dragulaService.remove('COLUMN')
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap(({el, source}) => {
          const sourceIndex = Number.parseInt(source.getAttribute('data-view-column-index'));
          const elIndex = Number.parseInt(el.getAttribute('data-column-index'));

          return this.updateColumnsArrangement(null, sourceIndex, elIndex);
        })
      )
      .subscribe();
  }

  private initCardDragBag(): void {
    const cardDragBag = this.dragulaService.createGroup('CARD', {
      moves: (el) => {
        return !!el.getAttribute('data-card-id') && Math.min(window.outerWidth, window.outerHeight) > 540;
      },
      copy: (el, source) => {
        return !source.hasAttribute('data-column-id');
      },
      accepts: (el, target) => {
        const targetId = Number.parseInt(target.getAttribute('data-column-id'));
        return !isNaN(targetId);
      },
    });

    this.dragulaService.drop('CARD')
      .pipe(
        takeUntil(this.unsubscribe$),
      )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .subscribe(({name, el, target, source, sibling}) => {
        if (!target)
        {
          return;
        }

        const targetColumnId = Number.parseInt(target.getAttribute('data-column-id'));
        const sourceColumnId = Number.parseInt(source.getAttribute('data-column-id'));
        const cardId = Number.parseInt(el.getAttribute('data-card-id'));
        const siblingCardId = sibling ? Number.parseInt(sibling.getAttribute('data-card-id')) : undefined;

        const laneElement = target.closest('[data-lane-id]');
        const targetLaneId = laneElement ? Number.parseInt(laneElement.getAttribute('data-lane-id')) : undefined;

        const placeholder = this.createPlaceholder(targetColumnId, cardId, siblingCardId, targetLaneId);
        cardDragBag.drake.cancel(true);
        if (sourceColumnId === targetColumnId) {
          this.updateCardOrder(placeholder);
        } else if (sourceColumnId) {
          this.moveCardToColumn(placeholder, sourceColumnId);
        } else {
          this.addPlaceholderAndShowPopover(placeholder);
        }
      });

    this.unsubscribe$.subscribe(() => {
      this.dragulaService.destroy('CARD');
    });
  }

  private createPlaceholder(targetColumnId: number, cardId: number, siblingCardId?: number, targetLaneId?: number): CardPlaceholder {
    const items = targetLaneId ? this.boardItemsByLaneId[targetLaneId] : this.boardItemsByColumnId[targetColumnId];

    return <CardPlaceholder>{
      cardId: cardId,
      columnId: targetColumnId,
      siblingCardId: siblingCardId,
      targetLaneId: targetLaneId,
      items: items
    };
  }

  private addPlaceholderAndShowPopover(placeholder: CardPlaceholder): void {
    if (placeholder.siblingCardId) {
      const insertIndex = placeholder.items.findIndex(t => t.card?.id === placeholder.siblingCardId);
      placeholder.items.splice(insertIndex, 0, { placeholder });
    } else {
      placeholder.items.push({ placeholder });
    }

    setTimeout(() => {
      this.droppedCardPopover.open();
    }, 1);
  }

  private updateCurrentBoardStyle(): void {
    if (!this.boardStyle || Math.min(window.outerWidth, window.outerHeight) < 768) {
      this.currentBoardStyle = BoardStyle.Vertical;
    } else {
      this.currentBoardStyle = this.boardStyle;
    }
  }
  
  private doFocusCard(cardId: number): void {
    this.focusedCardComponent?.unfocus();
    const cardComponent = this.cardComponents.find(t => t.card.id == cardId);
    cardComponent.focus();
    this.focusedCardComponent = cardComponent;
  }
  
  private getSortOrder(placeholder: CardPlaceholder): number {
    if (!placeholder.items?.length) {
      return 1;
    }

    if (!placeholder.siblingCardId) {
      return Math.max(...placeholder.items.map(t => t.card.sort_order)) + 1;
    }

    const nextCardSortOrder = placeholder.items.find(t => t.card.id === placeholder.siblingCardId).card.sort_order;

    let prevCardSortOrder = 0;
    const indexOfSibling = placeholder.items.findIndex(t => t.card.id === placeholder.siblingCardId);

    if (indexOfSibling === 0) {
      const minSortOrder = Math.min(...placeholder.items.map(t => t.card.sort_order));
      return minSortOrder - 1;
    }

    if (indexOfSibling > 0) {
      prevCardSortOrder = placeholder.items[indexOfSibling - 1].card.sort_order;
    }

    return (nextCardSortOrder + prevCardSortOrder) / 2;
  }
  
  private moveCardToColumn(placeholder: CardPlaceholder, fromId: number): void {
    const card = this.cards.find(t => t.id === placeholder.cardId);
    const from = findColumnRecursive(this.columns, fromId);
    const to = findColumnRecursive(this.columns, placeholder.columnId);

    const sortOrder = this.getSortOrder(placeholder);
    this.dialogService.cardTransition(card, from, to, sortOrder, placeholder.targetLaneId).subscribe();
  }

  private updateCardOrder(placeholder: CardPlaceholder): void {
    const sortOrder = this.getSortOrder(placeholder);

    const updatedCard$ = this.cardEditorService.updateCard(placeholder.cardId, {
      sort_order: sortOrder,
      lane_id: placeholder.targetLaneId
    });

    this.dialogService
      .loadingDialog(updatedCard$, 'Updating a card, please wait...')
      .subscribe();
  }
  
  private updateColumnsArrangement(targetIndex: number|null, sourceIndex: number, colIndex: number): Observable<void> {
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

    return this.boardService.setCustomColumns(this.board.id, this.customColumns);
  }
  
  private rearrangeColumns(): void {
    this.viewColumns = [];

    for (const col of this.columns) {
      const requiresCustomization = this.customColumns.reduce((a, i) => [...a, ...i], []).some(t => t === col.id);
      if (requiresCustomization && this.currentBoardStyle === BoardStyle.Vertical) {
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
  
  private sortColumns(): void {
    for (const col of this.columns) {
      if (!col.subcolumns?.length) {
        continue;
      }

      col.subcolumns!.sort(colSortPredicate);
    }

    this.columns.sort(colSortPredicate);
  }

  private checkCardMatchesFilter(card: CardEx): boolean {
    const hasMembers = this.filterValue?.members?.length
      ? this.filterValue.members.some(member => card.members?.map(t => t.id).includes(member.id))
      : null;

    const hasOwners = this.filterValue?.owners?.length
      ? this.filterValue?.owners?.some(owner => card.owner_id === owner.id)
      : null;

    const hasTags = this.filterValue?.tags?.length
      ? this.filterValue?.tags?.some(tag => card.tag_ids?.includes(tag.id))
      : null;

    const hasText = this.filterValue?.text
      ? card.title.toLowerCase().indexOf(this.filterValue.text?.toLowerCase()) !== -1 || `${card.id}`.indexOf(this.filterValue.text) !== -1
      : null;

    return (hasMembers === true || hasMembers === null)
      && (hasOwners === true || hasOwners === null)
      && (hasTags === true || hasTags === null)
      && (hasText === true || hasText === null);
  }

  private mapCardsByColumnId(cards: CardEx[]): void {
    const cardsByColumnId: Record<number, BoardItem[]> = flattenColumns(this.columns)
      .reduce((agg, item) => ({ ...agg, [item.id]: [] }), {});

    cards
      .filter((card) => this.checkCardMatchesFilter(card))
      .forEach((card) => cardsByColumnId[card.column_id].push(<BoardItem> { card }));

    for (const [, items] of Object.entries(cardsByColumnId)) {
      items.sort((a, b) => a.card.sort_order - b.card.sort_order);
    }

    this.boardItemsByColumnId = cardsByColumnId;
  }

  private mapCardsByLaneId(cards: CardEx[]): void {
    this.boardItemsByLaneId = {};
    for (const lane of this.board.lanes) {
      this.boardItemsByLaneId[lane.id] = [];
    }

    for (const card of cards) {
      if (this.checkCardMatchesFilter(card)) {
        this.boardItemsByLaneId[card.lane_id].push({ card });
      }
    }

    for (const [, items] of Object.entries(this.boardItemsByLaneId)) {
      items.sort((a, b) => a.card.sort_order - b.card.sort_order);
    }
  }

  private mapLanesById(): void {
    this.lanesById = this.board.lanes.reduce((agg, lane) => <Record<number, Lane>>{ ...agg, [lane.id]: lane }, {});
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyH' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.hideEmpty = !this.hideEmpty;
    }
  }

  @HostListener('window:resize', ['$event'])
  private handleWindowResize(): void {
    const lastBoardStyle = this.currentBoardStyle;
    this.updateCurrentBoardStyle();
    if (lastBoardStyle !== this.currentBoardStyle) {
      this.rearrangeColumns();
    }
  }
  
  private countCards(): void {
    this.cardsCountByRootColumnId = {};
    this.cardsCountByColumnId = {};
    this.cardsSizeByRootColumnId = {};
    for (const card of this.cards) {
      for (const column of this.columns) {
        if (this.cardsCountByRootColumnId[column.id] === undefined) {
          this.cardsCountByRootColumnId[column.id] = 0;
          this.cardsSizeByRootColumnId[column.id] = 0;
        }

        if (!this.cardsCountByColumnId[column.id]) {
          this.cardsCountByColumnId[column.id] = 0;
        }

        if (card.column_id === column.id) {
          this.cardsCountByColumnId[column.id]++;
          this.cardsCountByRootColumnId[column.id]++;
          this.cardsSizeByRootColumnId[column.id] += card.size;
          break;
        }

        for (const subcolumn of column.subcolumns || []) {
          if (!this.cardsCountByColumnId[subcolumn.id]) {
            this.cardsCountByColumnId[subcolumn.id] = 0;
          }

          if (card.column_id === subcolumn.id) {
            this.cardsCountByRootColumnId[column.id]++;
            this.cardsSizeByRootColumnId[column.id] += card.size;
            this.cardsCountByColumnId[subcolumn.id]++;

            break;
          }
        }
      }
    }
  }
  
}
