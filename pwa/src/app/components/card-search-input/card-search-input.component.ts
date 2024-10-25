import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  Badge,
  BadgeType,
  TypeaheadBadgeItemTemplateDirective,
  TypeaheadComponent,
  TypeaheadComponentValue
} from '../typeahead/typeahead.component';
import { map, Observable, of, Subject } from 'rxjs';
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
import { Board, BoardBase } from '../../models/board';
import { SpaceBoardPermissions } from '../../models/space-board-permissions';
import { CustomPropertyService } from '../../services/custom-property.service';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../../models/custom-property';

class UserBadge implements BadgeType {
  public get name(): string { return this.badgeName; }

  public get isOptions(): boolean { return true; }

  public constructor(private userService: UserService, private badgeName: string) {
  }

  public getTitle(item: User): string { return item.full_name; }

  public getOptions(offset: number, limit: number, query: string): Observable<User[]> {
    return this.userService.getUsers(offset, limit, query);
  }
}

class TagBadge implements BadgeType {
  public get name(): string { return 'tag'; }

  public get isOptions(): boolean { return true; }

  public constructor(private tagService: TagService) {
  }

  public getTitle(item: Tag): string { return item.name; }

  public getOptions(offset: number, limit: number, query: string): Observable<Tag[]> {
    return this.tagService.getTags(offset, limit, query);
  }
}

class CardTypeBadge implements BadgeType {
  public get name(): string { return 'type'; }

  public get isOptions(): boolean { return true; }

  public constructor(private boardService: BoardService) {
  }

  public getTitle(item: CardType): string { return item.name; }

  public getOptions(offset: number, limit: number, query: string): Observable<CardType[]> {
    return this.boardService
      .getCardTypes()
      .pipe(
        map(types => types.filter(t => query ? t.name.toLowerCase().includes(query.toLowerCase()) : t))
      );
  }
}

class BoardBadge implements BadgeType {
  public get name(): string { return 'board'; }

  public get isOptions(): boolean { return true; }

  public constructor(private boardService: BoardService) {
  }

  public getTitle(item: Board): string { return item.title; }

  public getOptions(offset: number, limit: number, query: string): Observable<SpaceBoardPermissions[]> {
    return this.boardService
      .getSpaces()
      .pipe(
        map(t => t.flatMap(c => c.boards)),
        map(boards => boards.filter(t => query ? t.title.toLowerCase().includes(query.toLowerCase()) : t))
      );
  }
}

class ArchivedBadge implements BadgeType {
  public get name(): string { return 'archived'; }

  public get isOptions(): boolean { return false; }

  public getTitle(val: boolean): string { return val ? 'Yes' : 'No'; }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getOptions(offset: number, limit: number, query: string): Observable<boolean[]> {
    return of([true]);
  }
}

interface CustomPropertyBadgeValue {
  property: CustomProperty;
  value: CustomPropertySelectValue;
}

class CustomPropertyBadge implements BadgeType {
  public get name(): string { return this.property.name.toLowerCase(); }

  public get isOptions(): boolean { return true; }

  public constructor(private property: CustomProperty, private values: CustomPropertySelectValue[]) {
  }

  public getTitle(item: CustomPropertyBadgeValue): string { return item.value.value; }

  public getOptions(offset: number, limit: number, query: string): Observable<CustomPropertyBadgeValue[]> {
    const filtered = this.values
      .filter(t => query ? t.value.toLowerCase().includes(query.toLowerCase()) : t)
      .map(t => (<CustomPropertyBadgeValue>{
        property: this.property,
        value: t
      }));

    return of(filtered);
  }
}

export type CardSearchInputBadgeTypes = 'member'|'owner'|'tag'|'archived'|'type'|'board'|'property';

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
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardSearchInputComponent),
      multi: true
    }
  ]
})
export class CardSearchInputComponent implements ControlValueAccessor, OnInit {
  @Input() public badges: CardSearchInputBadgeTypes[] = ['member', 'owner', 'tag', 'archived', 'type', 'board', 'property'];
  @Input() public inputClass: string = '';
  @Input() public placeholder?: string = '';
  @Input() public title: string;
  @Input() public titleClass: string;
  public readonly BadgeTypeMember: BadgeType = new UserBadge(this.userService, 'member');
  public readonly BadgeTypeOwner: BadgeType = new UserBadge(this.userService, 'owner');
  public readonly BadgeTypeTag: BadgeType = new TagBadge(this.tagService);
  public readonly BadgeTypeArchived: BadgeType = new ArchivedBadge();
  public readonly BadgeTypeCardType: BadgeType = new CardTypeBadge(this.boardService);
  public readonly BadgeTypeBoard: BadgeType = new BoardBadge(this.boardService);
  protected readonly getTextOrDefault = getTextOrDefault;
  protected badgeTypes: Array<BadgeType> = [];
  protected value: TypeaheadComponentValue = null;
  @ViewChild('typeahead', { read: TypeaheadComponent }) private typeahead: TypeaheadComponent;
  private onChangeCallback?: ChangeCallback<TypeaheadComponentValue>;
  private onTouchedCallback?: TouchedCallback;
  private availableBadgeType$: Subject<void> = new Subject<void>();

  public constructor(
    private customPropertyService: CustomPropertyService,
    private tagService: TagService,
    private userService: UserService,
    private boardService: BoardService
  ) {
    this.availableBadgeType$
      .pipe(
        // TODO: disabled until Kaiten API implements this
        // switchMap(() => this.customPropertyService.getCustomPropertiesWithValues())
        map(() => [])
      )
      .subscribe(customProperties => this.updateAvailableBadgeTypes(customProperties));
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

    this.availableBadgeType$.next();
  }

  public ngOnInit(): void {
    this.availableBadgeType$.next();
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

    this.availableBadgeType$.next();
  }

  private updateAvailableBadgeTypes(customProperties: CustomPropertyAndValues[]): void {
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

    if (this.badges.includes('property')) {
      for (const customProperty of customProperties.filter(t => t.property.type === 'select')) {
        this.badgeTypes.push(new CustomPropertyBadge(customProperty.property, customProperty.values));
      }
    }
  }
}
