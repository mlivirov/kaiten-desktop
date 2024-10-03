import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Injectable,
  Input,
  Output, Self, TemplateRef,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MdViewerComponent } from '../md-viewer/md-viewer.component';
import { MdEditorComponent } from '../md-editor/md-editor.component';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { AutosizeModule } from 'ngx-autosize';
import { filter, map, Observable, of, tap } from 'rxjs';
import { DialogService } from '../../services/dialog.service';
import { checkTextEquals } from '../../functions/check-text-equals';
import { ChangeCallback, TouchedCallback } from '../../core/types/change-callback.type';

@Injectable({ providedIn: 'root' })
export class TextEditorService {
  public activeEditor?: TextEditorComponent;
}

export interface TextEditorSaveEvent {
  value?: string;

  discard(): void;
  commit(): void;
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
  @Input({ required: true }) public type: 'markdown'|'textarea';
  @Input() public disabled = false;
  @Input() public isLoading = false;
  @Input() public placeholder: string;
  @Input() public minHeight?: number;
  @Input() public alwaysEditable = false;
  @Input() public additionalControls: TemplateRef<unknown>;

  public get isEditing(): boolean {
    return this.service.activeEditor === this;
  }
  @Output() protected save: EventEmitter<TextEditorSaveEvent> = new EventEmitter();
  @Output() protected editingChange = new EventEmitter<boolean>();
  protected newValue?: string;
  protected originalValue?: string;
  @ViewChild('mdEditor', { read: MdEditorComponent }) protected mdEditorComponent: MdEditorComponent;
  @ViewChild('textEditor', { read: ElementRef<HTMLTextAreaElement> }) protected textEditorElementRef: ElementRef<HTMLTextAreaElement>;
  private touchedCallback: TouchedCallback;
  private changeCallback: ChangeCallback<string>;

  public constructor(
    public service: TextEditorService,
    private dialogService: DialogService,
    @Self() private elementRef: ElementRef<HTMLElement>
  ) {
  }

  public registerOnChange(fn: ChangeCallback<string>): void {
    this.changeCallback = fn;
  }

  public registerOnTouched(fn: TouchedCallback): void {
    this.touchedCallback = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public writeValue(obj: string|null): void {
    if (this.alwaysEditable) {
      this.newValue = obj;
    }

    this.originalValue = obj;
  }

  public openEditor(event?: Event, scroll = true): void {
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

  public discardChangesWithConfirmation(event?: Event): Observable<boolean> {
    event?.stopPropagation();
    event?.preventDefault();

    return this.ensureNotChanged()
      .pipe(
        filter(r => !!r),
        tap(() => this.discardChanges())
      );
  }

  public focus(): void {
    this.elementRef.nativeElement.scrollIntoView({ block: 'center' });
    if (this.type === 'markdown') {
      this.mdEditorComponent.focus();
    } else {
      this.textEditorElementRef.nativeElement.focus();
    }
  }

  protected discardChanges(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    this.service.activeEditor = null;
    this.editingChange.emit(false);
  }

  protected notifySave(event?: Event): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.save.emit({
      value: this.newValue,
      discard() {
        self.discardChanges();
      },
      commit() {
        self.originalValue = self.newValue;
        self.changeCallback?.call(self, self.originalValue);
        self.discardChanges();
      }
    } as TextEditorSaveEvent);

    event?.stopPropagation();
    event?.preventDefault();
  }

  protected updateNewValue(value: string): void {
    if (this.alwaysEditable) {
      this.changeCallback?.call(this, value);
    } else {
      this.newValue = value;
    }
  }

  private ensureNotChanged(): Observable<boolean> {
    if (this.service.activeEditor && !checkTextEquals(this.service.activeEditor.originalValue, this.service.activeEditor.newValue)) {
      return this.dialogService.confirmation('There are unsaved changes. What would you like to do?', null, [
        { title: 'Discard', resultCode: 'discard', style: 'btn-danger' },
        { title: 'Continue editing', resultCode: undefined, style: 'btn-primary' },
      ]).pipe(
        map(res => {
          return res === 'discard';
        }),
      );
    }

    return of(true);
  }
  
  private doOpenEditor(scroll: boolean = false): void {
    this.service.activeEditor?.discardChanges();
    this.service.activeEditor = this;
    this.editingChange.emit(true);
    this.newValue = this.originalValue;

    if (scroll) {
      setTimeout(() => this.focus(), 1);
    }
  }

  @HostListener('keydown', ['$event'])
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Escape' && this.isEditing) {
      this.discardChanges();
    } else if (event.code === 'Enter' && event.ctrlKey && this.isEditing) {
      this.notifySave(event);
    }
  }
  
}
