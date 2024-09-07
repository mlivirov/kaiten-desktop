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

export interface BadgeType {
  name: string;
  getTitle(item: any): string;
}

export interface Badge {
  type: BadgeType;
  value: any;
}

export interface BadgeService {
  getOptions(type: BadgeType, offset: number, limit: number, query: string): Observable<any>;
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
export class TypeaheadBadgeItemTemplate {
  @Input() type: BadgeType;
  
  constructor(@Self() public templateRef: TemplateRef<any>) {
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
  value: string = '';
  popoverItems: any[] = [];
  popoverItemsLoading: boolean = false;

  currentPopoverItemIndex = 0;

  @ViewChild('input', { read: NgbPopover })
  popover: NgbPopover;

  @ViewChild('input', { read: ElementRef })
  input: ElementRef;

  @Input()
  title: string;

  @Input()
  titleClass: string;

  @Input()
  badgeTypes: BadgeType[] = [];

  @Input()
  inputClass: string = '';

  @Input()
  placeholder: string;

  @ContentChildren(TypeaheadBadgeItemTemplate)
  itemTemplates: QueryList<TypeaheadBadgeItemTemplate> = new QueryList();

  badges: Badge[] = [];
  currentBadgeType: BadgeType = null;

  onChangeCallback?: (value: TypeaheadComponentValue) => void;
  onTouchedCallback?: () => void;

  changeSubject = new Subject<void>();

  constructor(@Inject(BADGE_SERVICE) private badgeService: BadgeService) {
    this.changeSubject
      .pipe(
        debounceTime(1000),
      )
      .subscribe(() => {
        this.openPopoverIfAvailable();
      });
  }

  updateValue(value: string): void {
    this.value = value;
    this.notifyChange();
    this.changeSubject.next();
  }

  openPopoverIfAvailable(): void {
    for (const badgeType of this.badgeTypes) {
      const badgeTypeKeyword = `@${badgeType.name}`;
      if (this.value.startsWith(badgeTypeKeyword)) {
        this.currentBadgeType = badgeType;
        this.currentPopoverItemIndex = 0;
        this.popoverItemsLoading = true;
        // this.popover.close();

        const indexOfSpace = this.value.indexOf(' ');
        const query = this.value.substring(badgeTypeKeyword.length + 1, indexOfSpace === -1 ? undefined : indexOfSpace);
        this.popoverItems = [];

        this.badgeService.getOptions(badgeType, 0, 5, query)
          .pipe(
            finalize(() => this.popoverItemsLoading = false)
          )
          .subscribe(options => {
            this.popoverItems = options;
            this.popover.open();
          });

        return;
      }
    }

    if (this.value.startsWith('@')) {
      this.currentPopoverItemIndex = 0;
      this.currentBadgeType = null;
      this.popoverItems = this.badgeTypes;
      this.popover.open();
    }
  }

  removeBadge(badge: Badge): void {
    const index = this.badges.indexOf(badge);
    this.badges.splice(index, 1);
    this.notifyChange();
  }

  getCurrentTemplate(): TemplateRef<any> {
    const template = this.itemTemplates.find(t => t.type === this.currentBadgeType);
    return template.templateRef;
  }

  selectPopoverItem(item: any): void {
    if (this.currentBadgeType == null) {
      this.currentBadgeType = item;
      const indexOfSpace = this.value.indexOf(' ');
      this.value = indexOfSpace === -1 ? '' : this.value.substring(indexOfSpace + 1);
      this.value = `@${item.name}:` + this.value;
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

    this.value = this.value.substring(itemStarPos)
    this.popover.close(false);
    this.notifyChange();
  }

  @HostListener('keydown', ['$event'])
  handleInput(event: KeyboardEvent): void {
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

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  writeValue(obj: TypeaheadComponentValue): void {
    this.value = obj?.text;
    this.badges = obj?.badges ?? [];
  }

  notifyChange() {
    if (this.popover.isOpen()) {
      return;
    }

    this.onChangeCallback?.call(this, {
      text: this.value,
      badges: this.badges
    });
  }

  notifyTouched() {
    this.onTouchedCallback?.call(this);
  }
}
