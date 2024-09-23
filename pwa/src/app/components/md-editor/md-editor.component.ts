import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, ViewChild } from '@angular/core';
import Editor from '@toast-ui/editor';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { mdPlugin } from '../../functions/md-plugin';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { NgbPopover, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { UsersTypeaheadOperator } from '../../functions/typeahead/users.typeahead-operator';
import { User } from '../../models/user';
import { CardsTypeaheadOperator } from '../../functions/typeahead/cards.typeahead-operator';
import { Card } from '../../models/card';
import SimpleMDE from 'simplemde';
import { AutosizeModule } from 'ngx-autosize';
import WysiwygEditor = toastui.WysiwygEditor;
import ToolbarItem = toastui.ToolbarItem;
import { ChangeCallback, TouchedCallback } from '../../core/types/change-callback.type';

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
  @Input() public hideToolbar: boolean = false;
  @Input() public hideBorder: boolean = false;
  @Input() public placeholder: string;
  @Input() public minHeight: number = 35;
  @Input() public mode: 'markdown' | 'wysiwyg' = 'wysiwyg';
  @ViewChild('wysiwygEditorContainer') protected wysiwygEditorContainer: ElementRef;
  @ViewChild('markdownEditorTextarea') protected markdownEditorTextarea: ElementRef<HTMLTextAreaElement>;
  @ViewChild('usersPopover', { read: NgbPopover }) protected usersPopover: NgbPopover;
  @ViewChild('cardsPopover', { read: NgbPopover }) protected cardsPopover: NgbPopover;
  protected readonly allUsersTypeaheadSearch = UsersTypeaheadOperator();
  protected readonly cardsTypeaheadSearch = CardsTypeaheadOperator();
  protected readonly userTypeaheadFormatter = (item: User): string => item.full_name;
  protected readonly cardTypeaheadFormatter = (item: Card): string => item ? `${item.id} - ${item.title}` : '';
  private wysiwygEditor: Editor;
  private markdownEditor: SimpleMDE;
  private value: string;
  private changeCallback: ChangeCallback<string>;
  private touchedCallback: TouchedCallback;

  public constructor() {
  }

  public ngAfterViewInit(): void {
    if (this.mode === 'markdown') {
      this.initMarkdownEditor();
    } else {
      this.initWysiwygEditor();
    }
  }

  public ngOnDestroy(): void {
    this.destroyMarkdownEditor();
    this.destroyWysiwygEditor();
  }

  public registerOnChange(fn: ChangeCallback<string>): void {
    this.changeCallback = fn;
  }

  public registerOnTouched(fn: TouchedCallback): void {
    this.touchedCallback = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    setTimeout(() => {
      if (isDisabled) {
        this.wysiwygEditor?.getUI().getToolbar().disableAllButton();
      } else {
        this.wysiwygEditor?.getUI().getToolbar().enableAllButton();
      }
    }, 1);
  }

  public writeValue(obj: string): void {
    this.value = obj;
    this.wysiwygEditor?.setMarkdown(this.value);
    this.markdownEditor?.value(this.value || '');
  }

  public focus(): void {
    if (this.wysiwygEditor) {
      this.wysiwygEditor.focus();
    }

    if (this.markdownEditor) {
      this.markdownEditor.codemirror.focus();
    }
  }

  protected initWysiwygEditor(): void {
    this.mode = 'wysiwyg';
    this.destroyMarkdownEditor();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
        change(): void {
          self.value = self.wysiwygEditor.getMarkdown();
          self.changeCallback?.call(self, self.value);
        },
        focus(): void {
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
    toolbarButton.onclick = (): void => {
      this.initMarkdownEditor();
    };

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
  
  protected cancelMention(): void {
    this.usersPopover.close();
    this.cardsPopover.close();
    this.wysiwygEditor.focus();

    const wysiwygEditor = this.wysiwygEditor.getCurrentModeEditor() as WysiwygEditor;
    wysiwygEditor.getBody().querySelectorAll('[data-type="container"]').forEach(e => e.remove());
  }

  protected addCardLink(card: Card): void {
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

  protected addUserMention(user: User): void {
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

  private destroyMarkdownEditor(): void {
    if (!this.markdownEditor) {
      return;
    }

    this.markdownEditor.toTextArea();
    delete this.markdownEditor;
  }
  
  private initMarkdownEditor(): void {
    this.mode = 'markdown';
    this.destroyWysiwygEditor();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
  
  private destroyWysiwygEditor(): void {
    if (!this.wysiwygEditor) {
      return;
    }

    this.wysiwygEditor.remove();
    delete this.wysiwygEditor;
  }
  
}
