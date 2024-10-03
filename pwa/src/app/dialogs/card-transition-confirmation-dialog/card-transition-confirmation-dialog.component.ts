import { Component, Inject, Input } from '@angular/core';
import { Column } from '../../models/column';
import { CardEx } from '../../models/card-ex';
import { NgForOf, NgIf } from '@angular/common';
import { InlineMemberComponent } from '../../components/inline-member/inline-member.component';
import { TimeDotsComponent } from '../../components/time-dots/time-dots.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';
import { getLaneColor } from '../../functions/get-lane-color';

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
  @Input() public card?: CardEx;
  @Input() public from?: Column;
  @Input() public to?: Column;
  @Input() public sortOrder?: number;
  protected isMovingInProgress: boolean = false;

  public constructor(
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    public modal: NgbActiveModal
  ) {
  }

  protected move(): void {
    this.isMovingInProgress = true;

    this.cardEditorService
      .updateCard(this.card.id, {
        column_id: this.to.id,
        sort_order: this.sortOrder
      })
      .pipe(
        finalize(() => this.isMovingInProgress = false)
      )
      .subscribe(card => {
        this.modal.close(card);
      });
  }

  protected getBackgroundColor(): string {
    return getLaneColor(this.card.lane);
  }
}
