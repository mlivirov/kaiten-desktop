import {
  Component,
  ContentChildren,
  Directive,
  ElementRef, EventEmitter, HostListener,
  Input, Output,
  QueryList,
  Self,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { JsonPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

export interface EditorProperty<TValue = any, TExtra = any> {
  multi: boolean;
  label: string|null;
  name: string;
  value: TValue;
  type: string;
  extra?: TExtra;
}

export interface GroupOfEditorProperties {
  title: string;
  properties: EditorProperty[];
}

@Directive({
  selector: '[app-editor-property-template]',
  standalone: true,
})
export class EditorPropertyTemplate {
  @Input()
  mode: 'read'|'write';

  @Input()
  type: string;

  constructor(@Self() public templateRef: TemplateRef<any>) {
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
  @Input()
  properties: GroupOfEditorProperties[] = [];

  @ContentChildren(EditorPropertyTemplate, {read: EditorPropertyTemplate})
  templates: QueryList<EditorPropertyTemplate> = new QueryList();

  editingProperty?: EditorProperty;

  editingPropertyGroup?: GroupOfEditorProperties;

  editingPropertyValue?: any;

  @ViewChild('editor')
  editorContainer: ElementRef;

  @Output()
  saveRequested: EventEmitter<EditorProperty> = new EventEmitter();

  isSaveInProgress: boolean = false;

  getPropertyReaderTemplate(property: EditorProperty): TemplateRef<any> {
    return this.templates.find(t => t.type === property.type && t.mode === 'read')?.templateRef;
  }

  getPropertyWriterTemplate(property: EditorProperty): TemplateRef<any> {
    return this.templates.find(t => t.type === property.type && t.mode === 'write')?.templateRef;
  }

  startEditing(event: Event, group: GroupOfEditorProperties, property: EditorProperty) {
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
    }, 0);

    event.preventDefault();
    event.stopPropagation()
  }

  stopEditing() {
    this.editingProperty.value = this.editingPropertyValue;
    this.editingProperty = null;
    this.editingPropertyGroup = null;
  }

  saveProperty(event: Event) {
    this.isSaveInProgress = true;
    this.saveRequested.emit(this.editingProperty);
    event.stopPropagation();
    event.preventDefault();
  }

  commitChanges(newValue: any) {
    this.editingProperty.value = newValue;
    this.editingProperty = null;
    this.editingPropertyGroup = null;
    this.isSaveInProgress = false;
  }

  abortSave() {
    this.isSaveInProgress = false;
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.editingProperty && event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.stopEditing();
    } if (this.editingProperty && event.code === 'Enter') {
      this.saveProperty(event);
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickEvent(event: MouseEvent) {
    if (!(this.editorContainer && this.editingProperty)) {
      return;
    }

    const clickedInsideDropdown = (event.target as Element).closest('ngb-typeahead-window');
    const clickedInside = this.editorContainer.nativeElement.contains(event.target);
    if (!(clickedInside || clickedInsideDropdown)) {
      this.stopEditing();
    }
  }
}
