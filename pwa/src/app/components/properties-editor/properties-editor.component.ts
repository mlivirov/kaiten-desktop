import {
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  Self,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { JsonPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

export interface EditorProperty<TValue = unknown, TExtra = unknown> {
  multi: boolean;
  label: string|null;
  name: string;
  value: TValue;
  type: string;
  extra?: TExtra;
  clickable?: boolean;
}

export interface GroupOfEditorProperties {
  title: string;
  properties: EditorProperty[];
}

export interface EditorPropertyClickedEvent {
  property: EditorProperty;
  event: Event;
}

@Directive({
  selector: '[appEditorPropertyTemplate]',
  standalone: true,
})
export class EditorPropertyTemplateDirective {
  @Input() public mode: 'read'|'write';
  @Input() public type: string;

  public constructor(@Self() public templateRef: TemplateRef<unknown>) {
  }
}

@Component({
  selector: 'app-properties-editor',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    NgTemplateOutlet,
    JsonPipe,
    NgbPopover
  ],
  templateUrl: './properties-editor.component.html',
  styleUrl: './properties-editor.component.scss'
})
export class PropertiesEditorComponent {
  @Input() public properties: GroupOfEditorProperties[] = [];
  @ContentChildren(EditorPropertyTemplateDirective, {read: EditorPropertyTemplateDirective}) protected templates: QueryList<EditorPropertyTemplateDirective> = new QueryList();
  protected editingProperty?: EditorProperty;
  protected editingPropertyGroup?: GroupOfEditorProperties;
  protected editingPropertyValue?: unknown;
  @ViewChild('editor') private editorContainer: ElementRef;
  @Output() private saveRequested: EventEmitter<EditorProperty> = new EventEmitter();
  @Output() private editingStarted: EventEmitter<EditorProperty> = new EventEmitter();
  @Output() private propertyClick: EventEmitter<EditorPropertyClickedEvent> = new EventEmitter();
  protected isSaveInProgress: boolean = false;
  @Input() public keepEditingOnFocusLost: boolean = false;

  protected getEnumerablePropertyValues(value: unknown): unknown[] {
    if (!value) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new TypeError('The value must be a Array');
    }

    return <unknown[]>value;
  }

  protected checkPropertyHasValue(property: EditorProperty): boolean {
    return Array.isArray(property.value) && property.value.length > 0;
  }

  protected getPropertyReaderTemplate(property: EditorProperty): TemplateRef<unknown> {
    return this.templates.find(t => t.type === property.type && t.mode === 'read')?.templateRef;
  }

  protected getPropertyWriterTemplate(property: EditorProperty): TemplateRef<unknown> {
    return this.templates.find(t => t.type === property.type && t.mode === 'write')?.templateRef;
  }

  protected startEditing(event: Event, group: GroupOfEditorProperties, property: EditorProperty): void {
    if (property.clickable) {
      this.propertyClick.emit({ property, event });
    }

    if (!this.getPropertyWriterTemplate(property)) {
      return;
    }

    if (this.editingProperty) {
      return;
    }

    this.editingPropertyGroup = group;
    this.editingProperty = property;
    this.editingPropertyValue = property.value;

    setTimeout(() => {
      this.editorContainer.nativeElement.querySelector('.editor')?.focus();
    }, 1);

    this.editingStarted.emit(this.editingProperty);
    event.preventDefault();
    event.stopPropagation();
  }

  private stopEditing(): void {
    this.editingProperty.value = this.editingPropertyValue;
    this.editingProperty = null;
    this.editingPropertyGroup = null;
  }

  protected saveProperty(event?: Event): void {
    this.isSaveInProgress = true;
    this.saveRequested.emit(this.editingProperty);
    event?.stopPropagation();
    event?.preventDefault();
  }

  public commitChanges<T>(newValue: T): void {
    this.editingProperty.value = newValue;
    this.editingProperty = null;
    this.editingPropertyGroup = null;
    this.isSaveInProgress = false;
  }

  public abortSave(): void {
    this.isSaveInProgress = false;
  }

  @HostListener('keydown', ['$event'])
  private handleKeyDown(event: KeyboardEvent): void {
    if (this.editingProperty && event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.stopEditing();
    } if (this.editingProperty && event.code === 'Enter' && event.ctrlKey) {
      this.saveProperty(event);
    }
  }

  @HostListener('document:click', ['$event'])
  private handleClickEvent(event: MouseEvent): void {
    if (!(this.editorContainer && this.editingProperty)) {
      return;
    }

    const clickedInsideDropdown = (event.target as Element).closest('ngb-typeahead-window');
    const clickedInside = this.editorContainer.nativeElement.contains(event.target);
    if (!(clickedInside || clickedInsideDropdown || this.keepEditingOnFocusLost)) {
      this.stopEditing();
    }
  }
}
