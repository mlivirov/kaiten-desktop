import { Component } from '@angular/core';
import { Column } from '../../models/column';
import { CardEx } from '../../models/card-ex';
import { NgForOf, NgIf } from '@angular/common';
import { InlineMemberComponent } from '../../components/inline-member/inline-member.component';
import { TimeDotsComponent } from '../../components/time-dots/time-dots.component';
import { ApiService } from '../../services/api.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-card-transition-confirmation-dialog',
  standalone: true,
  imports: [
    NgIf,
    InlineMemberComponent,
    NgForOf,
    TimeDotsComponent
  ],
  templateUrl: './card-transition-confirmation-dialog.component.html',
  styleUrl: './card-transition-confirmation-dialog.component.scss'
})
export class CardTransitionConfirmationDialogComponent {
  card?: CardEx;
  from?: Column;
  to?: Column;

  isMovingInProgress: boolean = false;

  constructor(
    private apiService: ApiService,
    public modal: NgbActiveModal
  ) {
  }

  move() {
    this.isMovingInProgress = true;

    this.apiService
      .updateCard(this.card.id, {
        column_id: this.to.id
      })
      .pipe(
        finalize(() => this.isMovingInProgress = false)
      )
      .subscribe(card => {
        this.modal.close(card);
      });
  }
}
