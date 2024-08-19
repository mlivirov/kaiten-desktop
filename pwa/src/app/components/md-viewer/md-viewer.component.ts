import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, ViewChild } from '@angular/core';
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-md-viewer',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './md-viewer.component.html',
  styleUrl: './md-viewer.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MdViewerComponent),
      multi: true
    }
  ]
})
export class MdViewerComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('viewer')
  editorRef: ElementRef;
  viewer: Viewer;

  @Input()
  hideBorder: boolean = false;

  value: string;

  changeCallback: (value: string) => void;
  touchedCallback: () => void;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.viewer = new Viewer({
      el: this.editorRef.nativeElement,
      initialValue: this.value,
    });
  }

  ngOnDestroy(): void {
    this.viewer?.remove();
  }

  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }

  writeValue(obj: any): void {
    this.value = obj;
    this.viewer?.setMarkdown(this.value);
  }
}
