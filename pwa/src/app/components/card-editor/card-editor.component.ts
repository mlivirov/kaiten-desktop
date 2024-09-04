import { Component, Input, ViewChild } from '@angular/core';
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
import { finalize } from 'rxjs';
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
export class CardEditorComponent {
  @Input()
  showTitle: boolean = true;

  @Input()
  card: CardEx;

  isSaveInProgress: boolean = false;

  @ViewChild(CardListOfChecklistsComponent)
  cardListOfChecklists: CardListOfChecklistsComponent;

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

  addChecklist() {
    this.isSaveInProgress = true;
    this.apiService
      .addCardCheckList(this.card.id, {
        name: `This is your ${this.card.checklists?.length ?? 1} checklist`,
      })
      .pipe(
        finalize(() => this.isSaveInProgress = false)
      )
      .subscribe(checklist => {
        this.card.checklists = UnionIfNotExistsFunction(this.card.checklists, checklist, 'id');

        setTimeout(() => {
          const found = this.cardListOfChecklists.checklists.find(t => t.checklist.id == checklist.id);
          found.openTextEditor(null, true);
        }, 0);
      });
  }
}
