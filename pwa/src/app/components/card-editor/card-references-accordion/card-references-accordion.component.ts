import { Component, ElementRef, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CardReference, ListOfRelatedCardsComponent } from '../list-of-related-cards/list-of-related-cards.component';
import { NgForOf, NgIf, NgStyle } from '@angular/common';

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
  @Input()
  references: GroupOfReferences[] = [];

  @ViewChildren('group', { read: ElementRef })
  groups: QueryList<ElementRef>;

  countOfAllReferences: number = 0;

  focus(index: number) {
    this.groups.get(index).nativeElement.scrollIntoView();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.countOfAllReferences = this.references.reduce((agg, i) => [...agg, ...i.references], []).length;
  }
}
