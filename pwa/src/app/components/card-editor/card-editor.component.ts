import { Component, HostListener, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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
import { ApiService } from '../../services/api.service';
import { finalize, map, Observable, tap } from 'rxjs';
import {
  ListOfRelatedCardsComponent
} from './card-references-accordion/list-of-related-cards/list-of-related-cards.component';
import { CardStateLabelComponent } from './card-state-label/card-state-label.component';
import { CardReferencesAccordionComponent } from './card-references-accordion/card-references-accordion.component';
import { RouterLink } from '@angular/router';
import { TimeagoModule } from 'ngx-timeago';
import { CardCommentsComponent } from './card-comments/card-comments.component';
import { EditorPropertyTemplate, PropertiesEditorComponent, } from '../properties-editor/properties-editor.component';
import {
  NgbDatepicker,
  NgbDropdown,
  NgbDropdownAnchor,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbInputDatepicker,
  NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import { CardPropertiesComponent } from './card-properties/card-properties.component';
import { CardChecklistComponent } from './card-list-of-checklists/card-checklist/card-checklist.component';
import { CardListOfChecklistsComponent } from './card-list-of-checklists/card-list-of-checklists.component';
import { UnionIfNotExistsFunction } from '../../functions/union-if-not-exists.function';
import { CheckTextEqualsFunction } from '../../functions/check-text-equals.function';


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
    CardChecklistComponent,
    CardListOfChecklistsComponent,
    NgbDropdown,
    NgbDropdownAnchor,
    NgbDropdownItem,
    NgbDropdownMenu,
  ],
  templateUrl: './card-editor.component.html',
  styleUrl: './card-editor.component.scss',
})
export class CardEditorComponent implements OnChanges {
  CheckTextEqualsFunction = CheckTextEqualsFunction;

  @Input()
  showTitle: boolean = true;

  @Input()
  card: CardEx;

  originalDescription?: string;
  originalTitle?: string;

  isSaving: boolean = false;

  @ViewChild(CardListOfChecklistsComponent)
  cardListOfChecklists: CardListOfChecklistsComponent;

  constructor(private apiService: ApiService) {
  }

  updateAsap(value: boolean) {
    this.updateCard({ asap: value });
  }

  addChecklist() {
    this.isSaving = true;
    this.apiService
      .addCardCheckList(this.card.id, {
        name: `This is your ${this.card.checklists?.length ?? 1} checklist`,
      })
      .pipe(
        finalize(() => this.isSaving = false)
      )
      .subscribe(checklist => {
        this.card.checklists = UnionIfNotExistsFunction(this.card.checklists, checklist, 'id');

        setTimeout(() => {
          const found = this.cardListOfChecklists.checklists.find(t => t.checklist.id == checklist.id);
          found.openTextEditor(null, true);
        }, 0);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.originalDescription = this.card.description;
    this.originalTitle = this.card.title;
  }

  saveDescription($event: Event): void {
    this.updateCard({ description: this.card.description }).subscribe();
  }

  saveTitle($event: Event): void {
    this.updateCard({ title: this.card.title }).subscribe();
  }

  discardChanges(event: Event) {
    this.card.description = this.originalDescription;
    this.card.title = this.originalTitle;

    event.preventDefault();
    event.stopPropagation();
  }

  updateCard(data: Partial<CardEx>): Observable<void> {
    this.isSaving = true;
    return this.apiService
      .updateCard(this.card.id, data)
      .pipe(
        finalize(() => this.isSaving = false),
        tap((card) => {
          Object.assign(this.card, card);
          this.originalTitle = this.card.title;
          this.originalDescription = this.card.description;
        }),
        map(() => {})
      );
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape' && (this.card.title !== this.originalTitle || this.card.description !== this.originalDescription)) {
      this.discardChanges(event);
    } else if (event.code === 'Enter' && event.ctrlKey && this.card.title !== this.originalTitle) {
      this.saveTitle(event);
    } else if (event.code === 'Enter' && event.ctrlKey && this.card.description !== this.originalDescription) {
      this.saveDescription(event);
    }
  }
}
