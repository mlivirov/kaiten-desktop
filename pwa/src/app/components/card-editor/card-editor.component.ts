import { Component, Injectable, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  AsyncPipe,
  DatePipe,
  JsonPipe,
  NgForOf,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgTemplateOutlet
} from '@angular/common';
import { MdEditorComponent } from '../md-editor/md-editor.component';
import { FormsModule } from '@angular/forms';
import { CardEx } from '../../models/card-ex';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../../models/custom-property';
import { ApiService } from '../../services/api.service';
import { debounceTime, finalize, forkJoin, Observable, of, OperatorFunction, switchMap } from 'rxjs';
import { Lane } from '../../models/lane';
import { DialogService } from '../../services/dialogService';
import { CardReference, ListOfRelatedCardsComponent } from './card-references-accordion/list-of-related-cards/list-of-related-cards.component';
import { CardState } from '../../models/card-state';
import { CardStateLabelComponent } from './card-state-label/card-state-label.component';
import {
  CardReferencesAccordionComponent,
  GroupOfReferences
} from './card-references-accordion/card-references-accordion.component';
import { Router, RouterLink } from '@angular/router';
import { ColumnEx } from '../../models/column-ex';
import { TimeagoModule } from 'ngx-timeago';
import { CardCommentsComponent } from './card-comments/card-comments.component';
import {
  PropertiesEditorComponent,
  EditorPropertyTemplate,
} from '../properties-editor/properties-editor.component';
import {
  NgbDatepicker,
  NgbInputDatepicker,
  NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { CardPropertiesComponent } from './card-properties/card-properties.component';


@Component({
  selector: 'app-card-editor',
  standalone: true,
  imports: [
    DatePipe,
    MdEditorComponent,
    FormsModule,
    NgForOf,
    NgIf,
    InlineMemberComponent,
    JsonPipe,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    ListOfRelatedCardsComponent,
    CardStateLabelComponent,
    CardReferencesAccordionComponent,
    RouterLink,
    TimeagoModule,
    CardCommentsComponent,
    PropertiesEditorComponent,
    EditorPropertyTemplate,
    NgbDatepicker,
    NgbInputDatepicker,
    NgbTypeahead,
    AsyncPipe,
    NgbTooltip,
    CardPropertiesComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './card-editor.component.html',
  styleUrl: './card-editor.component.scss',
})
export class CardEditorComponent {
  @Input()
  showTitle: boolean = true;

  @Input()
  card: CardEx;

  isSaveInProgress: boolean = false;

  constructor(private apiService: ApiService) {
  }

  updateAsap(value: boolean) {
    this.isSaveInProgress = true;
    this.apiService
      .updateCard(this.card.id, {
        asap: value
      })
      .pipe(
        finalize(() => this.isSaveInProgress = false)
      )
      .subscribe(card => {
        this.card.asap = value;
      })
  }
}
