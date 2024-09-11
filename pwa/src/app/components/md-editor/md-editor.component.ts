import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, ViewChild } from '@angular/core';
import Editor from '@toast-ui/editor';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { mdPlugin } from '../../functions/md-plugin.function';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { NgbPopover, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { UsersTypeaheadOperator } from '../../functions/typeahead/users.typeahead-operator';
import { User } from '../../models/user';
import WysiwygEditor = toastui.WysiwygEditor;
import { CardsTypeaheadOperator } from '../../functions/typeahead/cards.typeahead-operator';
import { Card } from '../../models/card';

@Component({
  selector: 'app-md-editor',
  standalone: true,
  imports: [
    NgClass,
    InlineMemberComponent,
    NgbTypeahead,
    ReactiveFormsModule,
    NgbPopover,
    FormsModule
  ],
  templateUrl: './md-editor.component.html',
  styleUrl: './md-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MdEditorComponent),
      multi: true
    }
  ]
})
export class MdEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editor')
  editorRef: ElementRef;
  editor: Editor;

  @Input()
  hideToolbar: boolean = false;

  @Input()
  hideBorder: boolean = false;

  @Input()
  placeholder: string;

  @Input()
  minHeight: number = 35;

  @ViewChild('usersPopover', { read: NgbPopover })
  usersPopover: NgbPopover;

  @ViewChild('cardsPopover', { read: NgbPopover })
  cardsPopover: NgbPopover;

  value: string;

  allUsersTypeaheadSearch = UsersTypeaheadOperator();
  cardsTypeaheadSearch = CardsTypeaheadOperator();

  userTypeaheadFormatter = (item: User) => item.full_name;
  cardTypeaheadFormatter = (item: Card) => item ? `${item.id} - ${item.title}` : '';

  changeCallback: (value: string) => void;
  touchedCallback: () => void;

  constructor() {
  }

  ngAfterViewInit(): void {
    const self = this;
    this.editor = new Editor({
      el: this.editorRef.nativeElement,
      minHeight: `${this.minHeight}px`,
      height: 'auto',
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      initialValue: this.value,
      previewStyle: 'vertical',
      placeholder: this.placeholder,
      events: {
        change() {
          self.changeCallback?.call(self, self.editor.getMarkdown());
        },
        focus() {
          self.touchedCallback?.call(self);
        },
      },
      plugins: [
        mdPlugin()
      ]
    });

    this.editor.on('keyup', ({data}) => {
      const event = data as KeyboardEvent;
      const range = this.editor.getRange() as Range;
      if (event.code === 'Space' && range.endContainer.parentElement.innerHTML.startsWith('&gt;&nbsp;')) {
        range.startContainer.textContent = range.startContainer.textContent.substring(2);
        const block = document.createElement('div');
        const quote = block.appendChild(document.createElement('blockquote'));
        quote.append(document.createElement('br'));
        range.endContainer.parentElement.replaceWith(block);
      } else if (event.key === '#') {
        const anchor = document.createElement('span');
        anchor.setAttribute('data-type', 'container');

        range.insertNode(anchor);

        this.cardsPopover.positionTarget = anchor;
        this.cardsPopover.open();
        setTimeout(() => {
          (document.querySelector('#card-popover-input') as HTMLInputElement).focus();
        }, 1);
      } else if (event.key === '@') {
        const anchor = document.createElement('span');
        anchor.setAttribute('data-type', 'container');
        range.insertNode(anchor);
        this.usersPopover.positionTarget = anchor;
        this.usersPopover.open();
        setTimeout(() => {
          (document.querySelector('#user-popover-input') as HTMLInputElement).focus();
        }, 1);
      } else if (event.key === 'Esc' && this.usersPopover.isOpen()) {
        this.usersPopover.close();
      } else if (event.key === 'Esc' && this.cardsPopover.isOpen()) {
        this.cardsPopover.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.editor?.remove();
  }

  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean) {
    setTimeout(() => {
      if (isDisabled) {
        this.editor?.getUI().getToolbar().disableAllButton();
      } else {
        this.editor?.getUI().getToolbar().enableAllButton();
      }
    }, 1);
  }

  writeValue(obj: any): void {
    this.value = obj;
    this.editor?.setMarkdown(this.value);
  }

  cancelMention() {
    this.usersPopover.close();
    this.cardsPopover.close();
    this.editor.focus();

    const wysiwygEditor = this.editor.getCurrentModeEditor() as WysiwygEditor;
    wysiwygEditor.getBody().querySelectorAll('[data-type="container"]').forEach(e => e.remove());
  }

  addCardLink(card: Card) {
    if (!card) {
      return;
    }

    const wysiwygEditor = this.editor.getCurrentModeEditor() as WysiwygEditor;

    const element = document.createElement('a');
    element.setAttribute('href', `/${card.id}`);
    element.setAttribute('data-type', 'card-link');
    element.innerText = `${card.id} - ${card.title}`;
    const separatorElement = document.createTextNode('\u00A0');

    const range = this.editor.getRange() as Range;
    range.endContainer.textContent = range.endContainer.textContent.substring(0, range.endContainer.textContent.length - 1);

    const anchor = wysiwygEditor.getBody().querySelector('[data-type="container"]');
    anchor.parentElement.insertBefore(element, anchor);
    anchor.parentElement.insertBefore(separatorElement, anchor);
    anchor.remove();
    wysiwygEditor.moveCursorToEnd();

    this.cardsPopover.close();
    setTimeout(() => {
      this.editor.focus();
    }, 1);
  }

  addUserMention(user: User) {
    if (!user) {
      return;
    }

    const wysiwygEditor = this.editor.getCurrentModeEditor() as WysiwygEditor;

    const element = document.createElement('a');
    element.setAttribute('href', 'javascript:void(0)');
    element.setAttribute('data-type', 'user');
    element.classList.add('text-primary-balanced');
    element.innerHTML = `@${user.username}`;
    const separatorElement = document.createTextNode(',\u00A0');
    const range = this.editor.getRange() as Range;
    range.endContainer.textContent = range.endContainer.textContent.substring(0, range.endContainer.textContent.length - 1);

    const anchor = wysiwygEditor.getBody().querySelector('[data-type="container"]');
    anchor.parentElement.insertBefore(element, anchor);
    anchor.parentElement.insertBefore(separatorElement, anchor);
    anchor.remove();
    wysiwygEditor.moveCursorToEnd();

    this.usersPopover.close();
    setTimeout(() => {
      this.editor.focus();
    }, 1);
  }
}
