import { AfterViewInit, Component, ElementRef, forwardRef, OnDestroy, ViewChild } from '@angular/core';
import Editor from '@toast-ui/editor';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-md-editor',
  standalone: true,
  imports: [],
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

  value: string;

  changeCallback: (value: string) => void;
  touchedCallback: () => void;

  constructor() {
  }

  ngAfterViewInit(): void {
    const self = this;
    this.editor = new Editor({
      el: this.editorRef.nativeElement,
      minHeight: `100px`,
      height: 'auto',
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      initialValue: this.value,
      previewStyle: 'vertical',
      events: {
        change() {
          self.changeCallback?.call(self, self.editor.getMarkdown());
        },
        focus() {
          self.touchedCallback?.call(self);
        }
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

  writeValue(obj: any): void {
    this.value = obj;
    this.editor?.setMarkdown(this.value);
  }
}
