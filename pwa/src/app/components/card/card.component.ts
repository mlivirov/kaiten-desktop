import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TimeDotsComponent } from '../time-dots/time-dots.component';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { CardEx } from '../../models/card-ex';
import { CardService } from '../../services/card.service';
import { DialogService } from '../../services/dialogService';
import { Owner } from '../../models/owner';
import { MemberType } from '../../models/member-type';
import { filter, map, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    TimeDotsComponent,
    NgClass,
    NgIf,
    NgForOf,
    InlineMemberComponent,
    NgbTooltip,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input()
  card?: CardEx;

  @Input()
  disabled: boolean = false;

  @Output()
  updated: EventEmitter<CardEx> = new EventEmitter<CardEx>();

  active: boolean = false;

  get assignedMembers(): Owner[] {
    if (!this.card?.members) {
      return [];
    }

    if (this.card.members.length === 1) {
      return this.card.members;
    }

    const responsible = this.card.members.filter(m => m.type === MemberType.Responsible);

    if (responsible.length > 0) {
      return responsible;
    }

    return this.card.members;
  }

  constructor(
    private dialogService: DialogService,
    private cardService: CardService,
    private router: Router
  ) {
  }

  openCard(id: number) {
    this.router.navigate(['card', id]);
  }

  transitionToNextColumn() {
    this.cardService
      .getTransitionColumns(this.card)
      .pipe(
        switchMap(cols => {
          if (!cols) {
            return this.dialogService
              .alert('This card is already at the end of the current board.')
              .pipe(map(r => null))
          }

          return this.dialogService.cardTransition(this.card, cols.from, cols.to);
        }),
        filter(r => !!r)
      )
      .subscribe(card => {
        this.card = card;
        this.updated.emit(card);
      });
  }

  addBlock() {
  }
}
