import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe, NgClass, NgForOf, NgIf, NgSwitch } from '@angular/common';
import { Owner } from '../../../../models/owner';
import { MemberType } from '../../../../models/member-type';
import { InlineMemberComponent } from '../../../inline-member/inline-member.component';
import { Card } from '../../../../models/card';
import { CardState } from '../../../../models/card-state';
import { CardStateLabelComponent } from '../../card-state-label/card-state-label.component';
import { TimeagoModule } from 'ngx-timeago';
import { Router } from '@angular/router';

export interface CardReference {
  isCompleted: boolean;
  card: Card;
  id: number;
}

@Component({
  selector: 'app-list-of-related-cards',
  standalone: true,
  imports: [
    NgIf,
    InlineMemberComponent,
    DatePipe,
    NgForOf,
    NgSwitch,
    CardStateLabelComponent,
    NgClass,
    TimeagoModule
  ],
  templateUrl: './list-of-related-cards.component.html',
  styleUrl: './list-of-related-cards.component.scss'
})
export class ListOfRelatedCardsComponent {
  @Input() public title: string;
  @Input() public completedLabel: string;
  @Input() public items: CardReference[];
  @Input() public disabled: boolean = false;
  protected readonly CardState = CardState;
  @Output() protected delete: EventEmitter<CardReference> = new EventEmitter();

  public constructor(private router: Router) {
  }

  protected getResponsible(users: Owner[]): Owner[] {
    return users?.filter(t => t.type === MemberType.Responsible) || [];
  }

  protected openCard(id: number): void {
    this.router.navigate(['card', id]);
  }
}
