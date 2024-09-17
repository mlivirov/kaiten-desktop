import {
  Component, ContentChild, ContentChildren,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Injectable,
  Input,
  Output, TemplateRef,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MdViewerComponent } from '../md-viewer/md-viewer.component';
import { MdEditorComponent } from '../md-editor/md-editor.component';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { AutosizeModule } from 'ngx-autosize';
import { filter, finalize, map, Observable, of, tap } from 'rxjs';
import { DialogService } from '../../services/dialog.service';
import { CheckTextEqualsFunction } from '../../functions/check-text-equals.function';

@Injectable({ providedIn: 'root' })
export class TextEditorService {
  activeEditor?: TextEditorComponent;
}

export interface TextEditorSaveEvent {
  value?: string;

  discard();
  commit();
}

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [
    MdViewerComponent,
    FormsModule,
    MdEditorComponent,
    NgIf,
    AutosizeModule,
    NgTemplateOutlet
  ],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextEditorComponent),
      multi: true
    }
  ]
})
export class TextEditorComponent implements ControlValueAccessor {
  @Input({ required: true })
  type: 'markdown'|'textarea';

  @Input()
  disabled = false

  @Input()
  isLoading = false;

  @Input()
  placeholder: string;

  @Input()
  minHeight?: number;

  @Input()
  alwaysEditable = false;

  @Output()
  save: EventEmitter<TextEditorSaveEvent> = new EventEmitter();

  @Output()
  editingChange = new EventEmitter<boolean>();

  get isEditing() {
    return this.service.activeEditor === this;
  };

  newValue?: string;
  originalValue?: string;

  @ViewChild('mdEditor', { read: ElementRef })
  mdEditorElementRef: ElementRef;

  @ViewChild('textEditor', { read: ElementRef })
  textEditorElementRef: ElementRef;

  @Input()
  additionalControls: TemplateRef<any>;

  private touchedCallback: () => void;

  private changeCallback: (value: string) => void;

  constructor(public service: TextEditorService, private dialogService: DialogService) {
  }

  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: string|null): void {
    if (this.alwaysEditable) {
      this.newValue = obj;
    }

    this.originalValue = obj;
  }

  openEditor(event?: Event, scroll = true): void {
    event?.stopPropagation();
    event?.preventDefault();

    if (this.disabled) {
      return;
    }

    this.ensureNotChanged()
      .pipe(
        filter(r => !!r)
      )
      .subscribe(() => this.doOpenEditor(scroll));
  }

  ensureNotChanged(): Observable<boolean> {
    if (this.service.activeEditor && !CheckTextEqualsFunction(this.service.activeEditor.originalValue, this.service.activeEditor.newValue)) {
      return this.dialogService.confirmation('There are unsaved changes. What would you like to do?', null, [
        { title: 'Discard', resultCode: 'discard', style: 'btn-danger' },
        { title: 'Continue editing', resultCode: undefined, style: 'btn-primary' },
      ]).pipe(
        map(res => {
          if (res === 'discard') {
            return true;
          }

          return false;
        }),
      )
    }

    return of(true);
  }

  doOpenEditor(scroll: boolean) {
    this.service.activeEditor?.discardChanges();
    this.service.activeEditor = this;
    this.editingChange.emit(true);
    this.newValue = this.originalValue;

    if (scroll) {
      setTimeout(() => {
        const editorElement =
          this.type === 'markdown'
            ? ((this.mdEditorElementRef?.nativeElement as HTMLElement).querySelector('[contenteditable]')
                || (this.mdEditorElementRef?.nativeElement as HTMLElement).querySelector('textarea')) as HTMLElement
            : (this.textEditorElementRef.nativeElement as HTMLElement);

        editorElement.scrollIntoView({
          block: 'center'
        });
        editorElement.focus({ preventScroll: true });
      }, 1);
    }
  }

  discardChangesWithConfirmation(event?: Event): Observable<boolean> {
    event?.stopPropagation();
    event?.preventDefault();

    return this.ensureNotChanged()
      .pipe(
        filter(r => !!r),
        tap(() => this.discardChanges(event))
      )
  }


  discardChanges(event?: Event) {
    this.service.activeEditor = null;
    this.editingChange.emit(false);
  }

  notifySave(event?: Event) {
    const self = this;
    this.save.emit({
      value: this.newValue,
      discard() {
        self.discardChanges()
      },
      commit() {
        self.originalValue = self.newValue;
        self.changeCallback?.call(self, self.originalValue);
        self.discardChanges();
      }
    } as TextEditorSaveEvent)

    event?.stopPropagation();
    event?.preventDefault();
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape' && this.isEditing) {
      this.discardChanges(event);
    } else if (event.code === 'Enter' && event.ctrlKey && this.isEditing) {
      this.notifySave(event);
    }
  }

  updateNewValue(value: string) {
    if (this.alwaysEditable) {
      this.changeCallback?.call(this, value);
    } else {
      this.newValue = value;
    }
  }
}
