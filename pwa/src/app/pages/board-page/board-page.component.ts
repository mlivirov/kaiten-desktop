import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { BoardComponent } from '../../components/board/board.component';
import { Board } from '../../models/board';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgStyle } from '@angular/common';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';
import { CardEx } from '../../models/card-ex';
import { ColumnEx } from '../../models/column-ex';
import { CurrentBoardService } from '../../services/current-board.service';
import { CardFilter } from '../../services/card-search.service';
import { HttpParams } from '@angular/common/http';
import { User } from '../../models/user';
import { Tag } from '../../models/tag';
import { EMPTY, filter, map, of, Subject, switchMap, tap } from 'rxjs';
import { BoardStyle, DefaultSettings, Setting } from '../../models/setting';
import { SettingService } from '../../services/setting.service';
import { DialogService } from '../../services/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { ListOfCardsComponent } from '../../components/list-of-cards/list-of-cards.component';
import { BoardLanesLegendComponent } from '../../components/board-lanes-legend/board-lanes-legend.component';
import { LaneEx } from '../../models/lane';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CurrentUserComponent,
    PageHeaderComponent,
    BoardComponent,
    NgIf,
    CardSearchInputComponent,
    FormsModule,
    NgbCollapse,
    ListOfCardsComponent,
    NgStyle,
    BoardLanesLegendComponent
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss'
})
export class BoardPageComponent implements OnInit {
  protected board: Board;
  protected boardCards: CardEx[] = [];
  protected boardColumns: ColumnEx[] = [];
  protected boardLanes: LaneEx[] = [];
  protected filterValue?: CardFilter;
  protected boardStyle: BoardStyle = DefaultSettings.BoardStyle;
  protected isLeftPanelCollapsed: boolean = true;
  protected showLeftPanelExpandButton: boolean = true;
  protected isLeftPanelAvailable: boolean = true;
  @ViewChild('cardSearchInput', { read: CardSearchInputComponent }) private cardSearchInput: CardSearchInputComponent;
  @ViewChild('boardComponent', { read: BoardComponent }) private boardComponent: BoardComponent;
  private boardLoaded$: Subject<void> = new Subject();

  public constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private currentBoardService: CurrentBoardService,
    private settingService: SettingService,
    private dialogService: DialogService,
  ) {
    activatedRoute
      .data
      .pipe(
        takeUntilDestroyed(),
      )
      .subscribe(data => {
        this.board = data['board'];
        this.boardCards = data['cards'];
        this.boardColumns = data['columns'];
        this.boardLanes = data['lanes'];

        this.currentBoardService.boardId = this.board.id;
        this.currentBoardService.laneId = null;
      });

    activatedRoute
      .fragment
      .pipe(
        takeUntilDestroyed(),
        map(data => {
          const params = new HttpParams({ fromString: data });
          return this.deserializeCardFilterFromUrlParams(params);
        })
      )
      .subscribe(filter => {
        this.filterValue = filter;
        setTimeout(() => this.boardComponent.applyFilter(filter), 1);
      });

    this.boardLoaded$
      .pipe(
        switchMap(() => activatedRoute.fragment),
        filter(f => !!f),
      )
      .subscribe(data => {
        const params = new HttpParams({ fromString: data });
        if (params.has('card')) {
          const cardId = Number.parseInt(params.get('card'));
          setTimeout(() => this.boardComponent.focusCard(cardId), 1);
        }
      });

    this.settingService
      .getSetting<BoardStyle>(Setting.BoardStyle, null)
      .pipe(
        switchMap(t => t
          ? of(t)
          : Math.min(window.outerWidth, window.outerHeight) < 768
            ? of(BoardStyle.Vertical)
            : this.dialogService
              .selectBoardStyle()
              .pipe(
                tap(boardStyle => this.settingService.setSetting(Setting.BoardStyle, boardStyle).subscribe()),
                switchMap(() => EMPTY)
              )),
      )
      .subscribe(boardStyle => {
        this.boardStyle = <BoardStyle>boardStyle;
      });

    this.settingService
      .subscribeToChanges<BoardStyle>(Setting.BoardStyle)
      .pipe(
        takeUntilDestroyed(),
      )
      .subscribe(v => this.boardStyle = v);
  }

  public ngOnInit(): void {
    this.updateLeftPanelAvailability();
  }

  protected openCard(id: number): void {
    let fragment = `card=${id}`;
    let serializedFilter = null;
    if (this.filterValue) {
      serializedFilter = this.serializeCardFilterToUrlParams(this.filterValue);
    }

    if (serializedFilter?.length) {
      fragment += '&' + serializedFilter;
    }

    this.router.navigate(['board', this.board.id], {
      fragment: fragment,
      onSameUrlNavigation: 'ignore',
      replaceUrl: true,
    }).then(() => this.router.navigate(['card', id]));
  }

  protected switchBoard(boardId: number): void {
    this.router.navigate(['board', boardId]);
  }

  protected applyFilter(value?: CardFilter): void {
    this.router.navigate(['board', this.board.id], {
      fragment: this.serializeCardFilterToUrlParams(value),
      onSameUrlNavigation: 'ignore',
      replaceUrl: true
    });
  }

  protected handleBoardLoaded(): void {
    this.boardLoaded$.next();
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput.focus();
    }
  }

  @HostListener('window:resize', ['$event'])
  private handleWindowResize(): void {
    setTimeout(() => this.updateLeftPanelAvailability(), 1);
  }

  private updateLeftPanelAvailability(): void {
    this.isLeftPanelAvailable = Math.min(window.outerWidth, window.outerHeight) > 768;
  }

  private deserializeCardFilterFromUrlParams(params: HttpParams): CardFilter {
    const cardFilter: CardFilter = {};

    cardFilter.members = this.deserializeArrayOfObjectsFromUrlParams<User>(params, 'member', { id: 'number', full_name: 'string' });
    cardFilter.owners = this.deserializeArrayOfObjectsFromUrlParams<User>(params, 'owner', { id: 'number', full_name: 'string' });
    cardFilter.tags = this.deserializeArrayOfObjectsFromUrlParams<Tag>(params, 'tag', { id: 'number', name: 'string' });

    if (params.has('text')) {
      cardFilter.text = params.get('text');
    }

    return cardFilter;
  }

  private serializeCardFilterToUrlParams(value: CardFilter): string {
    let params = new HttpParams();

    if (value.text?.length) {
      params = params.set('text', value.text);
    }

    params = this.serializeArrayOfObjectsToUrlParams(params, value.members, 'member', 'id', 'full_name');
    params = this.serializeArrayOfObjectsToUrlParams(params, value.owners, 'owner', 'id', 'full_name');
    params = this.serializeArrayOfObjectsToUrlParams(params, value.tags, 'tag', 'id', 'name');

    return params.toString();
  }

  private serializeArrayOfObjectsToUrlParams<T>(
    params: HttpParams,
    objects: T[],
    name: string,
    ...properties: Extract<keyof T, string>[]
  ): HttpParams {
    for (const [index, val] of objects?.entries() || []) {
      for (const propertyName of properties) {
        params = params.append(`${name}_${index}_${propertyName}`, val[propertyName] as string|number|boolean);
      }
    }

    return params;
  }

  private deserializeArrayOfObjectsFromUrlParams<T>(
    params: HttpParams,
    name: string,
    properties: Partial<Record<keyof T, 'string'|'number'|'boolean'>>
  ): T[] {
    const result: T[] = [];

    let index = 0;
    while (params.has(`${name}_${index}_${Object.keys(properties)[0]}`)) {
      const item = {};
      for (const [propertyName, propertyType] of Object.entries(properties)) {
        const httpParamValue = params.get(`${name}_${index}_${propertyName}`);

        if (propertyType === 'number') {
          item[propertyName] = Number.parseInt(httpParamValue);
        } else if (propertyType === 'boolean') {
          item[propertyName] = httpParamValue === 'true';
        } else {
          item[propertyName] = httpParamValue;
        }
      }

      result.push(item as T);

      index++;
    }

    return result;
  }
}
