import { Component, forwardRef, Injectable, Input, ViewChild } from '@angular/core';
import {
  Badge,
  BADGE_SERVICE,
  BadgeService,
  BadgeType,
  TypeaheadBadgeItemTemplate,
  TypeaheadComponent,
  TypeaheadComponentValue
} from '../typeahead/typeahead.component';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';
import { Tag } from '../../models/tag';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { JsonPipe } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Injectable()
class CardBadgeService implements BadgeService {
  static readonly BadgeTypeMember: BadgeType = { name: 'member', getTitle(item: User) { return item.full_name; } };
  static readonly BadgeTypeOwner: BadgeType = { name: 'owner', getTitle(item: User) { return item.full_name; } };
  static readonly BadgeTypeTag: BadgeType = { name: 'tag', getTitle(item: Tag) { return item.name; } };
  static readonly BadgeTypeSpace: BadgeType = { name: 'tag', getTitle(item: Tag) { return item.name; } };

  constructor(private apiService: ApiService) {
  }

  getUsers(offset: number, limit: number, query: string): Observable<User[]> {
    return this.apiService.getUsers(offset, limit, query);
  }

  getTags(offset: number, limit: number, query: string): Observable<Tag[]> {
    return this.apiService.getTags(offset, limit, query);
  }

  public getOptions(type: BadgeType, offset: number, limit: number, query: string): Observable<any> {
    switch (type) {
      case CardBadgeService.BadgeTypeMember:
      case CardBadgeService.BadgeTypeOwner:
        return this.getUsers(offset, limit, query);
      case CardBadgeService.BadgeTypeTag:
        return this.getTags(offset, limit, query);
      default:
        throw 'not implemented';
    }
  }
}

export interface CardFilter {
  text?: string;
  members: User[];
  owners: User[];
  tags: Tag[];
}

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
export class CardSearchInputComponent implements ControlValueAccessor {
  BadgeTypeMember = CardBadgeService.BadgeTypeMember;
  BadgeTypeOwner = CardBadgeService.BadgeTypeOwner;
  BadgeTypeTag = CardBadgeService.BadgeTypeTag;

  badgeTypes = [
    this.BadgeTypeOwner,
    this.BadgeTypeTag,
    this.BadgeTypeMember,
  ]

  value: TypeaheadComponentValue = null;

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
    this.value = {
      text: value?.text,
      badges: [
        ...value?.members?.map((user: User) => (<Badge>{ type: this.BadgeTypeMember, value: user })) ?? [],
        ...value?.owners?.map((user: User) => (<Badge>{ type: this.BadgeTypeOwner, value: user })) ?? [],
        ...value?.tags?.map((tag: Tag) => (<Badge>{ type: this.BadgeTypeTag, value: tag })) ?? [],
      ]
    };
  }

  changeAndNotify(value: TypeaheadComponentValue) {
    this.value = value;
    this.onChangeCallback?.call(this, <CardFilter>{
      text: this.value.text,
      members: this.value.badges?.filter(t => t.type == this.BadgeTypeMember).map(t => t.value),
      owners: this.value.badges?.filter(t => t.type == this.BadgeTypeOwner).map(t => t.value),
      tags: this.value.badges?.filter(t => t.type == this.BadgeTypeTag).map(t => t.value),
    });
  }
}
