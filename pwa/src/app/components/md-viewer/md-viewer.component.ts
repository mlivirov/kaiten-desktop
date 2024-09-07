import {
  AfterViewInit,
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer';
import { NgClass, NgIf } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { mdPlugin } from '../../functions/md-plugin.function';

@Component({
  selector: 'app-md-viewer',
  standalone: true,
  imports: [
    NgClass,
    NgIf
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

  @Input()
  placeholder?: string;

  value: string;

  changeCallback: (value: string) => void;
  touchedCallback: () => void;

  constructor() {
  }

  ngAfterViewInit(): void {
    const plugins: unknown = [ mdPlugin() ];
    this.viewer = new Viewer({
      el: this.editorRef.nativeElement,
      initialValue: this.value,
      plugins: plugins as toastui.Plugin[]
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
