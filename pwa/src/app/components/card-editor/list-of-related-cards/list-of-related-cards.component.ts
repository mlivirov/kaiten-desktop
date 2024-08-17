import { Component, Input } from '@angular/core';
import { DatePipe, NgClass, NgForOf, NgIf, NgSwitch } from '@angular/common';
import { Owner } from '../../../models/owner';
import { MemberType } from '../../../models/member-type';
import { InlineMemberComponent } from '../../inline-member/inline-member.component';
import { Card } from '../../../models/card';
import { CardState } from '../../../models/card-state';
import { CardStateLabelComponent } from '../card-state-label/card-state-label.component';
import { TimeagoModule } from 'ngx-timeago';
import { Router } from '@angular/router';

export interface CardReference {
  isCompleted: boolean;
  card: Card;
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
  CardState = CardState;

  @Input()
  title: string;

  @Input()
  completedLabel: string;

  @Input()
  items: CardReference[];

  constructor(private router: Router) {
  }

  getResponsible(users: Owner[]): Owner[] {
    return users?.filter(t => t.type === MemberType.Responsible) || [];
  }

  openCard(id: number) {
    this.router.navigate(['card', id]);
  }

  protected readonly open = open;
}
