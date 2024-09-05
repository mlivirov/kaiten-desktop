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

@Injectable({ providedIn: 'root' })
class TextEditorService {
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

  constructor(public service: TextEditorService) {
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

  writeValue(obj: any): void {
    this.originalValue = obj;
  }

  openEditor(event?: Event, scroll = false): void {
    if (this.disabled) {
      return;
    }

    this.service.activeEditor?.discardChanges(event);
    this.newValue = this.originalValue;
    this.service.activeEditor = this;
    this.editingChange.emit(true);

    event?.stopPropagation();
    event?.preventDefault();

    if (scroll) {
      setTimeout(() => {
        const editorElement =
          this.type === 'markdown'
            ? (this.mdEditorElementRef?.nativeElement as HTMLElement).querySelector('[contenteditable]') as HTMLElement
            : (this.textEditorElementRef.nativeElement as HTMLElement);

        editorElement.scrollIntoView({
          block: 'center'
        });
        editorElement.focus({ preventScroll: true });
      }, 1);
    }
  }

  discardChanges(event?: Event) {
    this.service.activeEditor = null;
    this.editingChange.emit(false);

    event?.stopPropagation();
    event?.preventDefault();
  }

  notifySave(event: Event|null) {
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

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape' && this.isEditing) {
      this.discardChanges(event);
    } else if (event.code === 'Enter' && event.ctrlKey && this.isEditing) {
      this.notifySave(event);
    }
  }
}
