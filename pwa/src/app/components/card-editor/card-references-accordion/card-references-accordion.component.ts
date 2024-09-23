import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import { CardReference, ListOfRelatedCardsComponent } from './list-of-related-cards/list-of-related-cards.component';
import { NgForOf, NgIf, NgStyle } from '@angular/common';
import { CardEx } from '../../../models/card-ex';
import { CardState } from '../../../models/card-state';
import { nameof } from '../../../functions/name-of';

export type ReferenceType = 'BLOCKER'|'BLOCKING'|'CHILDREN'|'PARENT';

export interface GroupOfReferences {
  type: ReferenceType;
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
  @Input({ required: true }) public card: CardEx;
  @Input() public disabled: boolean = false;
  protected references: GroupOfReferences[] = [];
  @ViewChildren('group', { read: ElementRef }) protected groups: QueryList<ElementRef>;
  protected countOfAllReferences: number = 0;
  @Output() protected deleteParent: EventEmitter<number> = new EventEmitter();
  @Output() protected deleteChild: EventEmitter<number> = new EventEmitter();
  @Output() protected deleteBlocker: EventEmitter<number> = new EventEmitter();

  public focusByType(type: ReferenceType): void {
    const index = this.references.findIndex(t => t.type === type);
    this.focus(index);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardReferencesAccordionComponent>('card')]) {
      this.references = this.extractReferences();
      this.countOfAllReferences = this.references.reduce((agg, i) => [...agg, ...i.references], []).length;
    }
  }

  protected focus(index: number): void {
    (this.groups.get(index).nativeElement as HTMLElement).scrollIntoView({ block: 'start' });
  }

  protected deleteReference(group: GroupOfReferences, item: CardReference): void {
    if (group.type === 'BLOCKER') {
      this.deleteBlocker.emit(item.id);
    } else if (group.type === 'CHILDREN') {
      this.deleteChild.emit(item.id);
    } else if (group.type === 'PARENT') {
      this.deleteParent.emit(item.id);
    }
  }

  private extractReferences(): GroupOfReferences[] {
    return [
      <GroupOfReferences>{
        type: 'BLOCKER',
        title: 'Blockers',
        completedLabel: 'released',
        references: this.card.blockers?.filter(t => !!t.card)
          .map(t => (<CardReference>{
            card: t.card,
            isCompleted: t.released
          })) || []
      },
      <GroupOfReferences>{
        type: 'BLOCKING',
        title: 'Blocking',
        completedLabel: 'released',
        references: this.card.blocking_blockers?.filter(t => !!t.blocked_card).map(t => (<CardReference> {
          card: t.blocked_card,
          isCompleted: t.released,
          id: t.id,
        })) || []
      },
      <GroupOfReferences>{
        type: 'CHILDREN',
        title: 'Children',
        completedLabel: 'done',
        references: this.card.children?.map(t => (<CardReference> {
          card: t,
          isCompleted: t.state === CardState.Done,
          id: t.id,
        })) || []
      },
      <GroupOfReferences>{
        type: 'PARENT',
        title: 'Parents',
        completedLabel: 'done',
        references: this.card.parents?.map(t => (<CardReference> {
          card: t,
          isCompleted: t.state === CardState.Done,
          id: t.id,
        })) || []
      }
    ].filter(t => t.references.length);
  }
  
}
