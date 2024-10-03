import { Component, forwardRef, Injectable, Input, OnInit, ViewChild } from '@angular/core';
import {
  Badge,
  BADGE_SERVICE,
  BadgeService,
  BadgeType,
  TypeaheadBadgeItemTemplateDirective,
  TypeaheadComponent,
  TypeaheadComponentValue
} from '../typeahead/typeahead.component';
import { map, Observable, of } from 'rxjs';
import { User } from '../../models/user';
import { Tag } from '../../models/tag';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { JsonPipe } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CardFilter } from '../../services/card-search.service';
import { TagService } from '../../services/tag.service';
import { UserService } from '../../services/user.service';
import { ChangeCallback, TouchedCallback } from '../../core/types/change-callback.type';
import { CardType } from '../../models/card-type';
import { BoardService } from '../../services/board.service';
import { getTextOrDefault } from '../../functions/get-text-or-default';
import { BoardBase } from '../../models/board';
import { SpaceBoardPermissions } from '../../models/space-board-permissions';

@Injectable()
class CardBadgeService implements BadgeService {
  public static readonly BadgeTypeMember: BadgeType = { name: 'member', options: true, getTitle(item: User) { return item.full_name; } };
  public static readonly BadgeTypeOwner: BadgeType = { name: 'owner', options: true, getTitle(item: User) { return item.full_name; } };
  public static readonly BadgeTypeTag: BadgeType = { name: 'tag', options: true, getTitle(item: Tag) { return item.name; } };
  public static readonly BadgeTypeArchived: BadgeType = { name: 'archived', options: false, getTitle(val: boolean): string { return val ? 'Yes' : 'No';  } };
  public static readonly BadgeTypeCardType: BadgeType = { name: 'type', options: true, getTitle(val: CardType): string { return val.name; } };
  public static readonly BadgeTypeBoard: BadgeType = { name: 'board', options: true, getTitle(val: SpaceBoardPermissions): string { return getTextOrDefault(val.title); } };

  public constructor(
    private tagService: TagService,
    private userService: UserService,
    private boardService: BoardService
  ) {
  }

  public getOptions(type: BadgeType, offset: number, limit: number, query: string): Observable<unknown[]> {
    switch (type) {
      case CardBadgeService.BadgeTypeMember:
      case CardBadgeService.BadgeTypeOwner:
        return this.getUsers(offset, limit, query);
      case CardBadgeService.BadgeTypeTag:
        return this.getTags(offset, limit, query);
      case CardBadgeService.BadgeTypeCardType:
        return this.getCardTypes().pipe(
          map(types => types.filter(t => query ? t.name.toLowerCase().includes(query.toLowerCase()) : t))
        );
      case CardBadgeService.BadgeTypeArchived:
        return of([true]);
      case CardBadgeService.BadgeTypeBoard:
        return this.getBoards().pipe(
          map(boards => boards.filter(t => query ? t.title.toLowerCase().includes(query.toLowerCase()) : t))
        );
      default:
        throw 'not implemented';
    }
  }

  protected getCardTypes(): Observable<CardType[]> {
    return this.boardService.getCardTypes();
  }

  protected getBoards(): Observable<SpaceBoardPermissions[]> {
    return this.boardService.getSpaces().pipe(map(t => t.flatMap(c => c.boards)));
  }

  private getUsers(offset: number, limit: number, query: string): Observable<User[]> {
    return this.userService.getUsers(offset, limit, query);
  }
  
  private getTags(offset: number, limit: number, query: string): Observable<Tag[]> {
    return this.tagService.getTags(offset, limit, query);
  }
  
}

export type CardSearchInputBadgeTypes = 'member'|'owner'|'tag'|'archived'|'type'|'board';

@Component({
  selector: 'app-card-search-input',
  standalone: true,
  imports: [
    TypeaheadComponent,
    TypeaheadBadgeItemTemplateDirective,
    InlineMemberComponent,
    JsonPipe,
    FormsModule
  ],
  templateUrl: './card-search-input.component.html',
  styleUrl: './card-search-input.component.scss',
  providers: [
    {
      provide: BADGE_SERVICE,
      useClass: CardBadgeService
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardSearchInputComponent),
      multi: true
    }
  ]
})
export class CardSearchInputComponent implements ControlValueAccessor, OnInit {
  @Input() public badges: CardSearchInputBadgeTypes[] = ['member', 'owner', 'tag', 'archived', 'type', 'board'];
  @Input() public inputClass: string = '';
  @Input() public placeholder?: string = '';
  @Input() public title: string;
  @Input() public titleClass: string;
  protected readonly getTextOrDefault = getTextOrDefault;
  protected readonly BadgeTypeMember = CardBadgeService.BadgeTypeMember;
  protected readonly BadgeTypeOwner = CardBadgeService.BadgeTypeOwner;
  protected readonly BadgeTypeTag = CardBadgeService.BadgeTypeTag;
  protected readonly BadgeTypeArchived = CardBadgeService.BadgeTypeArchived;
  protected readonly BadgeTypeCardType = CardBadgeService.BadgeTypeCardType;
  protected readonly BadgeTypeBoard = CardBadgeService.BadgeTypeBoard;
  protected badgeTypes: Array<BadgeType> = [];
  protected value: TypeaheadComponentValue = null;
  @ViewChild('typeahead', { read: TypeaheadComponent }) private typeahead: TypeaheadComponent;
  private onChangeCallback?: ChangeCallback<TypeaheadComponentValue>;
  private onTouchedCallback?: TouchedCallback;

  public constructor() {
  }

  public focus(): void {
    this.typeahead?.focus();
  }

  public registerOnChange(fn: ChangeCallback<TypeaheadComponentValue>): void {
    this.onChangeCallback = fn;
  }

  public registerOnTouched(fn: TouchedCallback): void {
    this.onTouchedCallback = fn;
  }

  public writeValue(value: CardFilter): void {
    const badges = [
      ...value?.members?.map((user: User) => (<Badge>{ type: this.BadgeTypeMember, value: user })) ?? [],
      ...value?.owners?.map((user: User) => (<Badge>{ type: this.BadgeTypeOwner, value: user })) ?? [],
      ...value?.tags?.map((tag: Tag) => (<Badge>{ type: this.BadgeTypeTag, value: tag })) ?? [],
    ];

    if (value?.board) {
      badges.push(<Badge>{
        type: this.BadgeTypeBoard,
        value: value.board
      });
    }

    if (value?.type) {
      badges.push(<Badge>{
        type: this.BadgeTypeCardType,
        value: value.type
      });
    }

    if (value?.includeArchived) {
      badges.push(<Badge>{
        type: this.BadgeTypeArchived,
        value: true
      });
    }

    this.value = {
      text: value?.text,
      badges: badges
    };

    this.updateAvailableBadgeTypes();
  }

  public ngOnInit(): void {
    this.updateAvailableBadgeTypes();
  }

  protected changeAndNotify(value: TypeaheadComponentValue): void {
    this.value = value;
    this.onChangeCallback?.call(this, <CardFilter>{
      text: this.value.text,
      members: this.value.badges?.filter(t => t.type == this.BadgeTypeMember).map(t => t.value),
      owners: this.value.badges?.filter(t => t.type == this.BadgeTypeOwner).map(t => t.value),
      tags: this.value.badges?.filter(t => t.type == this.BadgeTypeTag).map(t => t.value),
      includeArchived: this.value.badges?.find(t => t.type == this.BadgeTypeArchived)?.value,
      type: <CardType>this.value.badges?.find(t => t.type == this.BadgeTypeCardType)?.value,
      board: <BoardBase>this.value.badges?.find(t => t.type == this.BadgeTypeBoard)?.value,
    });

    this.updateAvailableBadgeTypes();
  }

  private updateAvailableBadgeTypes(): void {
    this.badgeTypes = [];

    if (this.badges.includes('member')) {
      this.badgeTypes.push(this.BadgeTypeMember);
    }

    if (this.badges.includes('tag')) {
      this.badgeTypes.push(this.BadgeTypeTag);
    }

    if (this.badges.includes('owner')) {
      this.badgeTypes.push(this.BadgeTypeOwner);
    }

    if (this.badges.includes('archived') && !this.value?.badges.find(t => t.type == this.BadgeTypeArchived)) {
      this.badgeTypes.push(this.BadgeTypeArchived);
    }

    if (this.badges.includes('type') && !this.value?.badges.find(t => t.type == this.BadgeTypeCardType)) {
      this.badgeTypes.push(this.BadgeTypeCardType);
    }

    if (this.badges.includes('board') && !this.value?.badges.find(t => t.type == this.BadgeTypeBoard)) {
      this.badgeTypes.push(this.BadgeTypeBoard);
    }
  }
}
