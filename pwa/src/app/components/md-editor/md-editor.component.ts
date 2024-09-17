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
import SimpleMDE from 'simplemde';
import { AutosizeModule } from 'ngx-autosize';
import ToolbarItem = toastui.ToolbarItem;
import ToolbarButton = toastui.ToolbarButton;

@Component({
  selector: 'app-md-editor',
  standalone: true,
  imports: [
    NgClass,
    InlineMemberComponent,
    NgbTypeahead,
    ReactiveFormsModule,
    NgbPopover,
    FormsModule,
    AutosizeModule
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
  @ViewChild('wysiwygEditorContainer')
  wysiwygEditorContainer: ElementRef;
  wysiwygEditor: Editor;

  @ViewChild('markdownEditorTextarea')
  markdownEditorTextarea: ElementRef<HTMLTextAreaElement>;
  markdownEditor: SimpleMDE;

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

  @Input()
  mode: 'markdown' | 'wysiwyg' = 'wysiwyg';

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
    if (this.mode === 'markdown') {
      this.initMarkdownEditor();
    } else {
      this.initWysiwygEditor();
    }
  }

  destroyMarkdownEditor() {
    if (!this.markdownEditor) {
      return;
    }

    this.markdownEditor.toTextArea();
    delete this.markdownEditor;
  }

  initMarkdownEditor() {
    this.mode = 'markdown';
    this.destroyWysiwygEditor();
    const self = this;
    this.markdownEditor = new SimpleMDE({
      element: this.markdownEditorTextarea.nativeElement,
      spellChecker: false,
      toolbar: false,
      placeholder: this.placeholder,
      initialValue: this.value,
      autofocus: true,
      forceSync: true,
      status: false
    });

    this.markdownEditor.codemirror.on('change', () => {
      self.value = this.markdownEditor.value();
      self.changeCallback?.call(self, self.value);
    });
  }

  destroyWysiwygEditor() {
    if (!this.wysiwygEditor) {
      return;
    }

    this.wysiwygEditor.remove();
    delete this.wysiwygEditor;
  }

  initWysiwygEditor() {
    this.mode = 'wysiwyg';
    this.destroyMarkdownEditor();
    const self = this;
    this.wysiwygEditor = new Editor({
      el: this.wysiwygEditorContainer.nativeElement,
      minHeight: `${this.minHeight}px`,
      height: 'auto',
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      initialValue: this.value,
      previewStyle: 'vertical',
      placeholder: this.placeholder,
      events: {
        change() {
          self.value = self.wysiwygEditor.getMarkdown();
          self.changeCallback?.call(self, self.value);
        },
        focus() {
          self.touchedCallback?.call(self);
        },
      },
      plugins: [
        mdPlugin()
      ]
    });

    const toolbarButton = document.createElement('button');
    toolbarButton.innerText = 'MARKDOWN';
    toolbarButton.classList.add('custom-button');
    toolbarButton.onclick = () => {
      this.initMarkdownEditor();
    }

    this.wysiwygEditor.getUI().getToolbar().insertItem(0, {
      el: toolbarButton,
      on() {
        toolbarButton.disabled = false;
      },
      off() {
        toolbarButton.disabled = true;
      },
      remove: null,
      trigger: null,
      destroy() {
        toolbarButton.remove();
      }
    } as unknown as ToolbarItem);

    this.wysiwygEditor.on('keyup', ({data}) => {
      const event = data as KeyboardEvent;
      const range = this.wysiwygEditor.getRange() as Range;
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
    this.destroyMarkdownEditor();
    this.destroyWysiwygEditor();
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
        this.wysiwygEditor?.getUI().getToolbar().disableAllButton();
      } else {
        this.wysiwygEditor?.getUI().getToolbar().enableAllButton();
      }
    }, 1);
  }

  writeValue(obj: any): void {
    this.value = obj;
    this.wysiwygEditor?.setMarkdown(this.value);
    this.markdownEditor?.value(this.value || '');
  }

  cancelMention() {
    this.usersPopover.close();
    this.cardsPopover.close();
    this.wysiwygEditor.focus();

    const wysiwygEditor = this.wysiwygEditor.getCurrentModeEditor() as WysiwygEditor;
    wysiwygEditor.getBody().querySelectorAll('[data-type="container"]').forEach(e => e.remove());
  }

  addCardLink(card: Card) {
    if (!card) {
      return;
    }

    const wysiwygEditor = this.wysiwygEditor.getCurrentModeEditor() as WysiwygEditor;

    const element = document.createElement('a');
    element.setAttribute('href', `/${card.id}`);
    element.setAttribute('data-type', 'card-link');
    element.innerText = `${card.id} - ${card.title}`;
    const separatorElement = document.createTextNode('\u00A0');

    const range = this.wysiwygEditor.getRange() as Range;
    range.endContainer.textContent = range.endContainer.textContent.substring(0, range.endContainer.textContent.length - 1);

    const anchor = wysiwygEditor.getBody().querySelector('[data-type="container"]');
    anchor.parentElement.insertBefore(element, anchor);
    anchor.parentElement.insertBefore(separatorElement, anchor);
    anchor.remove();
    wysiwygEditor.moveCursorToEnd();

    this.cardsPopover.close();
    setTimeout(() => {
      this.wysiwygEditor.focus();
    }, 1);
  }

  addUserMention(user: User) {
    if (!user) {
      return;
    }

    const wysiwygEditor = this.wysiwygEditor.getCurrentModeEditor() as WysiwygEditor;

    const element = document.createElement('a');
    element.setAttribute('href', 'javascript:void(0)');
    element.setAttribute('data-type', 'user');
    element.classList.add('text-primary-balanced');
    element.innerHTML = `@${user.username}`;
    const separatorElement = document.createTextNode(',\u00A0');
    const range = this.wysiwygEditor.getRange() as Range;
    range.endContainer.textContent = range.endContainer.textContent.substring(0, range.endContainer.textContent.length - 1);

    const anchor = wysiwygEditor.getBody().querySelector('[data-type="container"]');
    anchor.parentElement.insertBefore(element, anchor);
    anchor.parentElement.insertBefore(separatorElement, anchor);
    anchor.remove();
    wysiwygEditor.moveCursorToEnd();

    this.usersPopover.close();
    setTimeout(() => {
      this.wysiwygEditor.focus();
    }, 1);
  }

  handleMarkdownChanges(value: string) {
    this.value = value;
    this.wysiwygEditor?.setMarkdown(value);
  }
}
