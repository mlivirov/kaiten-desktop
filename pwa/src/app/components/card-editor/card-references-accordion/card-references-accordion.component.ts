import { Component, ElementRef, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CardReference, ListOfRelatedCardsComponent } from './list-of-related-cards/list-of-related-cards.component';
import { NgForOf, NgIf, NgStyle } from '@angular/common';
import { CardEx } from '../../../models/card-ex';
import { CardState } from '../../../models/card-state';

export interface GroupOfReferences {
  title: string;
  completedLabel: string;
  references: CardReference[];
}

@Component({
  selector: 'app-card-references-accordion',
  standalone: true,
  imports: [
    NgForOf,
    ListOfRelatedCardsComponent,
    NgIf,
    NgStyle
  ],
  templateUrl: './card-references-accordion.component.html',
  styleUrl: './card-references-accordion.component.scss'
})
export class CardReferencesAccordionComponent implements OnChanges {
  @Input({ required: true })
  card: CardEx;

  references: GroupOfReferences[] = [];

  @ViewChildren('group', { read: ElementRef })
  groups: QueryList<ElementRef>;

  countOfAllReferences: number = 0;

  focus(index: number) {
    (this.groups.get(index).nativeElement as HTMLElement).scrollIntoView({ block: 'center' });
  }

  extractReferences() {
    return [
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

  ngOnChanges(changes: SimpleChanges): void {
    this.references = this.extractReferences();
    this.countOfAllReferences = this.references.reduce((agg, i) => [...agg, ...i.references], []).length;
  }
}
