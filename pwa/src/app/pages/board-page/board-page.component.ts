import { Component, HostListener, ViewChild } from '@angular/core';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { BoardComponent } from '../../components/board/board.component';
import { BoardBase } from '../../models/board';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';
import { CardEx } from '../../models/card-ex';
import { ColumnEx } from '../../models/column-ex';
import { CurrentBoardService } from '../../services/current-board.service';
import { CardFilter } from '../../services/card-search.service';
import { HttpParams } from '@angular/common/http';
import { User } from '../../models/user';
import { Tag } from '../../models/tag';
import { filter } from 'rxjs';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CurrentUserComponent,
    PageHeaderComponent,
    BoardComponent,
    NgIf,
    CardSearchInputComponent,
    FormsModule
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss'
})
export class BoardPageComponent {
  protected board: BoardBase;
  protected boardCards: CardEx[] = [];
  protected boardColumns: ColumnEx[] = [];
  @ViewChild('cardSearchInput', { read: CardSearchInputComponent }) private cardSearchInput: CardSearchInputComponent;
  @ViewChild('boardComponent', { read: BoardComponent }) private boardComponent: BoardComponent;
  protected filterValue?: CardFilter;

  public constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private currentBoardService: CurrentBoardService,
  ) {
    activatedRoute
      .data
      .subscribe(data => {
        this.board = data['board'];
        this.boardCards = data['cards'];
        this.boardColumns = data['columns'];

        this.currentBoardService.boardId = this.board.id;
        this.currentBoardService.laneId = null;
      });

    activatedRoute
      .fragment
      .pipe(
        filter(f => !!f)
      )
      .subscribe(data => {
        const params = new HttpParams({ fromString: data });
        this.filterValue = this.deserializeCardFilterFromUrlParams(params);
        console.log(this.filterValue);
        setTimeout(() => {
          this.boardComponent.applyFilter(this.filterValue);

          if (params.has('card')) {
            const cardId = Number.parseInt(params.get('card'));
            this.boardComponent.focusCard(cardId);
          }
        }, 1);
      });
  }

  protected openCard(id: number): void {
    let fragment = `card=${id}`;
    if (this.filterValue) {
      fragment += '&'+this.serializeCardFilterToUrlParams(this.filterValue);
    }

    this.router.navigate(['board', this.board.id], {
      fragment: fragment,
      onSameUrlNavigation: 'ignore',
    }).then(() => this.router.navigate(['card', id]));
  }

  protected switchBoard(boardId: number): void {
    this.router.navigate(['board', boardId]);
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput.focus();
    }
  }

  protected applyFilter(value?: CardFilter): void {
    this.filterValue = value;
    this.router.navigate(['board', this.board.id], {
      fragment: this.serializeCardFilterToUrlParams(this.filterValue),
      onSameUrlNavigation: 'ignore',
      replaceUrl: true
    });

    this.boardComponent.applyFilter(this.filterValue);
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
      const item: T = {} as T;
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

      result.push(item);

      index++;
    }

    return result;
  }
}
