import { Component, forwardRef, Injectable, Input, OnInit, ViewChild } from '@angular/core';
import {
  Badge,
  BADGE_SERVICE,
  BadgeService,
  BadgeType,
  TypeaheadBadgeItemTemplate,
  TypeaheadComponent,
  TypeaheadComponentValue
} from '../typeahead/typeahead.component';
import { Observable, of } from 'rxjs';
import { User } from '../../models/user';
import { Tag } from '../../models/tag';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { JsonPipe } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CardFilter } from '../../services/card-search.service';
import { TagService } from '../../services/tag.service';
import { UserService } from '../../services/user.service';

@Injectable()
class CardBadgeService implements BadgeService {
  static readonly BadgeTypeMember: BadgeType = { name: 'member', multi: true, getTitle(item: User) { return item.full_name; } };
  static readonly BadgeTypeOwner: BadgeType = { name: 'owner', multi: true, getTitle(item: User) { return item.full_name; } };
  static readonly BadgeTypeTag: BadgeType = { name: 'tag', multi: true, getTitle(item: Tag) { return item.name; } };
  static readonly BadgeTypeSpace: BadgeType = { name: 'tag', multi: true, getTitle(item: Tag) { return item.name; } };
  static readonly BadgeTypeArchived: BadgeType = { name: 'archived', multi: false, getTitle(val: boolean): string { return val ? 'Yes' : 'No';  } };

  constructor(private tagService: TagService, private userService: UserService) {
  }

  getUsers(offset: number, limit: number, query: string): Observable<User[]> {
    return this.userService.getUsers(offset, limit, query);
  }

  getTags(offset: number, limit: number, query: string): Observable<Tag[]> {
    return this.tagService.getTags(offset, limit, query);
  }

  public getOptions(type: BadgeType, offset: number, limit: number, query: string): Observable<any> {
    switch (type) {
      case CardBadgeService.BadgeTypeMember:
      case CardBadgeService.BadgeTypeOwner:
        return this.getUsers(offset, limit, query);
      case CardBadgeService.BadgeTypeTag:
        return this.getTags(offset, limit, query);
      case CardBadgeService.BadgeTypeArchived:
        return of([true]);
      default:
        throw 'not implemented';
    }
  }
}

export type CardSearchInputBadgeTypes = 'member'|'owner'|'tag'|'archived';

@Component({
  selector: 'app-card-search-input',
  standalone: true,
  imports: [
    TypeaheadComponent,
    TypeaheadBadgeItemTemplate,
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
  BadgeTypeMember = CardBadgeService.BadgeTypeMember;
  BadgeTypeOwner = CardBadgeService.BadgeTypeOwner;
  BadgeTypeTag = CardBadgeService.BadgeTypeTag;
  BadgeTypeArchived = CardBadgeService.BadgeTypeArchived;

  badgeTypes = []

  value: TypeaheadComponentValue = null;

  @Input()
  badges: CardSearchInputBadgeTypes[] = ['member', 'owner', 'tag'];

  @Input()
  inputClass: string = '';

  @Input()
  placeholder?: string = '';

  @Input()
  title: string;

  @Input()
  titleClass: string;

  @ViewChild('typeahead', { read: TypeaheadComponent })
  typeahead: TypeaheadComponent;

  onChangeCallback?: (value: TypeaheadComponentValue) => void;
  onTouchedCallback?: () => void;

  constructor() {
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  writeValue(value: CardFilter): void {
    const badges = [
      ...value?.members?.map((user: User) => (<Badge>{ type: this.BadgeTypeMember, value: user })) ?? [],
      ...value?.owners?.map((user: User) => (<Badge>{ type: this.BadgeTypeOwner, value: user })) ?? [],
      ...value?.tags?.map((tag: Tag) => (<Badge>{ type: this.BadgeTypeTag, value: tag })) ?? [],
    ];

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
  }

  changeAndNotify(value: TypeaheadComponentValue) {
    this.value = value;
    this.onChangeCallback?.call(this, <CardFilter>{
      text: this.value.text,
      members: this.value.badges?.filter(t => t.type == this.BadgeTypeMember).map(t => t.value),
      owners: this.value.badges?.filter(t => t.type == this.BadgeTypeOwner).map(t => t.value),
      tags: this.value.badges?.filter(t => t.type == this.BadgeTypeTag).map(t => t.value),
      includeArchived: this.value.badges?.find(t => t.type == this.BadgeTypeArchived)?.value,
    });
  }

  ngOnInit(): void {
    if (this.badges.includes('member')) {
      this.badgeTypes.push(this.BadgeTypeMember);
    }

    if (this.badges.includes('tag')) {
      this.badgeTypes.push(this.BadgeTypeTag);
    }

    if (this.badges.includes('owner')) {
      this.badgeTypes.push(this.BadgeTypeOwner);
    }

    if (this.badges.includes('archived')) {
      this.badgeTypes.push(this.BadgeTypeArchived);
    }
  }
}
