import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe, JsonPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { MdEditorComponent } from '../md-editor/md-editor.component';
import { FormsModule } from '@angular/forms';
import { CardEx } from '../../models/card-ex';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { CustomPropertyAndValues } from '../../models/custom-property';
import { ApiService } from '../../services/api.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { Lane } from '../../models/lane';
import { DialogService } from '../../services/dialogService';
import { CardReference, ListOfRelatedCardsComponent } from './list-of-related-cards/list-of-related-cards.component';
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
    CardCommentsComponent
  ],
  templateUrl: './card-editor.component.html',
  styleUrl: './card-editor.component.scss'
})
export class CardEditorComponent implements OnChanges {
  NumberMin = Number.MIN_VALUE;
  NumberMax = Number.MAX_VALUE;

  @Input()
  showTitle: boolean = true;

  @Input()
  card: CardEx;


  customProperties: CustomPropertyAndValues[] = [];
  lanes: Lane[] = [];
  columns: ColumnEx[] = [];
  references: GroupOfReferences[] = [];

  constructor(private apiService: ApiService, private dialogService: DialogService, private router: Router) {
    this.loadCustomProperties();
  }

  extractReferences() {
    this.references = [
      {
        title: 'Blockers',
        completedLabel: 'released',
        references: this.card.blockers?.filter(t => !!t.card)
          .map(t => (<CardReference>{
            card: t.card,
            isCompleted: t.released
          })) || []
      },
      {
        title: 'Blocking',
        completedLabel: 'released',
        references: this.card.blocking_blockers?.filter(t => !!t.blocked_card).map(t => (<CardReference> {
          card: t.blocked_card,
          isCompleted: t.released
        })) || []
      },
      {
        title: 'Children',
        completedLabel: 'done',
        references: this.card.children?.map(t => (<CardReference> {
          card: t,
          isCompleted: t.state === CardState.Done
        })) || []
      },
      {
        title: 'Parents',
        completedLabel: 'done',
        references: this.card.parents?.map(t => (<CardReference> {
          card: t,
          isCompleted: t.state === CardState.Done
        })) || []
      }
    ].filter(t => t.references.length);
  }

  loadColumns(boardId: number) {
    this.apiService.getColumns(boardId).subscribe(columns => {
      this.columns = [];
      for (const col of columns) {
        if (col.subcolumns) {
          this.columns.push(...col.subcolumns)
        } else {
          this.columns.push(col);
        }
      }
    });
  }

  getCustomPropertyValue(id: number) {
    if (!this.card.properties) {
      return null;
    }

    const value = this.card.properties['id_' + id];
    if (Array.isArray(value)) {
      return value[0];
    }

    return value ? value : null;
  }

  loadCustomProperties() {
    this.apiService
      .getCustomProperties()
      .pipe(
        switchMap(properties => {
          const results = properties.map(property => {
            if (property.type === 'select') {
              return this.apiService
                .getCustomPropertyValues(property.id)
                .pipe(
                  map(values => ({ property, values } as CustomPropertyAndValues))
                );
            } else {
              return of({ property, values: null } as CustomPropertyAndValues);
            }
          });

          return forkJoin<CustomPropertyAndValues[]>(results);
        }),
      )
      .subscribe(t => this.customProperties = t);
  }

  openCard(id: number) {
    this.router.navigate(['card', id]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.card) {
      this.loadColumns(this.card.board_id);
      this.extractReferences();
    }
  }
}
