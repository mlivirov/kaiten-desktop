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
import { mdPlugin } from '../../functions/md-plugin';
import { Router } from '@angular/router';
import { ChangeCallback, TouchedCallback } from '../../core/types/change-callback.type';

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
  @ViewChild('viewer') protected editorRef: ElementRef;
  private viewer: Viewer;
  @Input() public hideBorder: boolean = false;
  @Input() public inlineIcon?: string;
  @Input() public placeholder?: string;
  protected value: string;
  private changeCallback: ChangeCallback<string>;
  private touchedCallback: TouchedCallback;

  public constructor(private router: Router) {
  }

  public ngAfterViewInit(): void {
    const plugins: unknown = [ mdPlugin() ];
    this.viewer = new Viewer({
      el: this.editorRef.nativeElement,
      initialValue: this.value,
      plugins: plugins as toastui.Plugin[]
    });
  }

  public ngOnDestroy(): void {
    this.viewer?.remove();
  }

  @HostListener('click', ['$event'])
  private handleClick(event: Event): void {
    if (!(event.target instanceof HTMLAnchorElement)) {
      return;
    }

    const href = event.target?.attributes.getNamedItem('href')?.value;
    if (href?.startsWith('/')) {
      event.preventDefault();
      event.stopPropagation();

      this.router.navigateByUrl(href);
    }
  }

  public registerOnChange(fn: ChangeCallback<string>): void {
    this.changeCallback = fn;
  }

  public registerOnTouched(fn: TouchedCallback): void {
    this.touchedCallback = fn;
  }

  public writeValue(obj: string): void {
    this.value = obj;
    this.viewer?.setMarkdown(this.value);
  }
}
