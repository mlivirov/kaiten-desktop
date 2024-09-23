import {
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Inject,
  InjectionToken,
  Input,
  QueryList,
  Self,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { JsonPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { debounceTime, finalize, Observable, Subject } from 'rxjs';
import { ChangeCallback, TouchedCallback } from '../../core/types/change-callback.type';

export interface BadgeType {
  name: string;
  multi: boolean;
  getTitle(item: unknown): string;
}

export interface Badge {
  type: BadgeType;
  value: unknown;
}

export interface BadgeService {
  getOptions(type: BadgeType, offset: number, limit: number, query: string): Observable<unknown[]>;
}

export const BADGE_SERVICE: InjectionToken<BadgeService> = new InjectionToken('BadgeService');

export interface TypeaheadComponentValue {
  text?: string;
  badges?: Badge[];
}

@Directive({
  selector: '[appTypeaheadBadgeItemTemplate]',
  standalone: true,
})
export class TypeaheadBadgeItemTemplateDirective {
  @Input() public type: BadgeType;

  public constructor(@Self() public templateRef: TemplateRef<unknown>) {
  }
}

@Component({
  selector: 'app-typeahead',
  standalone: true,
  imports: [
    FormsModule,
    NgbPopover,
    NgForOf,
    NgIf,
    NgTemplateOutlet,
    JsonPipe
  ],
  templateUrl: './typeahead.component.html',
  styleUrl: './typeahead.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypeaheadComponent),
      multi: true
    }
  ]
})
export class TypeaheadComponent implements ControlValueAccessor {
  protected value: string = '';
  protected popoverItems: Array<unknown> = [];
  protected popoverItemsLoading: boolean = false;
  protected currentPopoverItemIndex = 0;
  @ViewChild('input', { read: NgbPopover }) private popover: NgbPopover;
  @ViewChild('input', { read: ElementRef }) private input: ElementRef;
  @Input() public title: string;
  @Input() public titleClass: string;
  @Input() public badgeTypes: BadgeType[] = [];
  @Input() public inputClass: string = '';
  @Input() public placeholder: string;
  @ContentChildren(TypeaheadBadgeItemTemplateDirective) protected itemTemplates: QueryList<TypeaheadBadgeItemTemplateDirective> = new QueryList();
  protected badges: Badge[] = [];
  protected currentBadgeType: BadgeType = null;
  private onChangeCallback?: ChangeCallback<TypeaheadComponentValue>;
  private onTouchedCallback?: TouchedCallback;
  private changeSubject = new Subject<void>();

  public constructor(@Inject(BADGE_SERVICE) private badgeService: BadgeService) {
    this.changeSubject
      .pipe(
        debounceTime(1000),
      )
      .subscribe(() => {
        this.openPopoverIfAvailable();
      });
  }

  public focus(): void {
    this.input?.nativeElement.focus();
  }

  protected updateValue(value: string): void {
    this.value = value;
    this.notifyChange();
    this.changeSubject.next();
  }

  private openPopoverIfAvailable(): void {
    for (const badgeType of this.badgeTypes) {
      const badgeTypeKeyword = `@${badgeType.name}`;
      if (this.value?.startsWith(badgeTypeKeyword)) {
        this.currentBadgeType = badgeType;
        this.currentPopoverItemIndex = 0;
        this.popoverItemsLoading = true;

        const indexOfSpace = this.value.indexOf(' ');
        const query = this.value.substring(badgeTypeKeyword.length + 1, indexOfSpace === -1 ? undefined : indexOfSpace);
        this.popoverItems = [];

        this.badgeService.getOptions(badgeType, 0, 5, query)
          .pipe(
            finalize(() => this.popoverItemsLoading = false)
          )
          .subscribe(options => {
            if (badgeType.multi) {
              this.popoverItems = options;
              this.popover.open();
            } else {
              this.selectPopoverItem(options[0]);
            }
          });

        return;
      }
    }

    if (this.value?.startsWith('@')) {
      this.currentPopoverItemIndex = 0;
      this.currentBadgeType = null;
      this.popoverItems = this.badgeTypes;
      this.popover.open();
    }
  }

  protected removeBadge(badge: Badge): void {
    const index = this.badges.indexOf(badge);
    this.badges.splice(index, 1);
    this.notifyChange();
  }

  protected getCurrentTemplate(): TemplateRef<unknown> {
    const template = this.itemTemplates.find(t => t.type === this.currentBadgeType);
    return template.templateRef;
  }

  protected selectPopoverItem(item: BadgeType | unknown): void {
    if (this.currentBadgeType == null) {
      this.currentBadgeType = <BadgeType>item;
      const indexOfSpace = this.value.indexOf(' ');
      this.value = indexOfSpace === -1 ? '' : this.value.substring(indexOfSpace + 1);
      this.value = `@${this.currentBadgeType.name}:` + this.value;
      this.openPopoverIfAvailable();
      return;
    }

    this.badges.push({
      type: this.currentBadgeType,
      value: item,
    });

    this.currentBadgeType = null;
    this.currentPopoverItemIndex = -1;

    let itemStarPos = this.value.indexOf(' ');
    if (itemStarPos === -1) {
      itemStarPos = this.value.length;
    }

    this.value = this.value.substring(itemStarPos);
    this.popover.close(false);
    this.notifyChange();
  }

  @HostListener('keydown', ['$event'])
  private handleInput(event: KeyboardEvent): void {
    if (this.popoverItemsLoading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.code === 'Space' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.openPopoverIfAvailable();
    } else if ((event.code === 'ArrowDown' || event.code === 'Tab') && this.popover.isOpen()) {
      this.currentPopoverItemIndex = this.currentPopoverItemIndex === this.popoverItems.length - 1
        ? 0
        : this.currentPopoverItemIndex + 1;

      event.preventDefault();
      event.stopPropagation();
    } else if (event.code === 'ArrowUp' && this.popover.isOpen()) {
      this.currentPopoverItemIndex = this.currentPopoverItemIndex === 0
        ? this.popoverItems.length - 1
        : this.currentPopoverItemIndex - 1;

      event.preventDefault();
      event.stopPropagation();
    } else if (event.code === 'Enter' && this.popover.isOpen()) {
      this.selectPopoverItem(this.popoverItems[this.currentPopoverItemIndex]);

      event.preventDefault();
      event.stopPropagation();
    }
  }

  public registerOnChange(fn: ChangeCallback<TypeaheadComponentValue>): void {
    this.onChangeCallback = fn;
  }

  public registerOnTouched(fn: TouchedCallback): void {
    this.onTouchedCallback = fn;
  }

  public writeValue(obj: TypeaheadComponentValue): void {
    this.value = obj?.text;
    this.badges = obj?.badges ?? [];
  }

  protected notifyChange(): void {
    if (this.popover.isOpen()) {
      return;
    }

    this.onChangeCallback?.call(this, {
      text: this.value,
      badges: this.badges
    });
  }

  protected notifyTouched(): void {
    this.onTouchedCallback?.call(this);
  }
}
