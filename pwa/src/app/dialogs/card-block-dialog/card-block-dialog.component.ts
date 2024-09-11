import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { NgbActiveModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { CardsTypeaheadOperator } from '../../functions/typeahead/cards.typeahead-operator';
import { Card } from '../../models/card';
import { CardEx } from '../../models/card-ex';
import { DialogService } from '../../services/dialog.service';
import { filter, finalize } from 'rxjs';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';


export interface CardBlockDialogResult {
  description: string;
  blocker: CardEx;
}

@Component({
  selector: 'app-card-block-dialog',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgOptimizedImage,
    ReactiveFormsModule,
    NgbTypeahead,
    TextEditorComponent
  ],
  templateUrl: './card-block-dialog.component.html',
  styleUrl: './card-block-dialog.component.scss'
})
export class CardBlockDialogComponent {
  cardsTypeaheadSearch = CardsTypeaheadOperator();
  cardTypeaheadFormatter = (item: Card) => item ? `${item.id} - ${item.title}` : '';

  isLoading: boolean = false;
  cardId: number;
  blockerId?: number;
  blockerCard: CardEx;
  description: string;

  constructor(
    private dialogService: DialogService,
    public modal: NgbActiveModal,
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService
  ) {
  }

  searchCard() {
    this.dialogService
      .searchCard('single')
      .pipe(
        filter(r => !!r)
      )
      .subscribe(selected => this.blockerCard = selected[0]);
  }

  continue() {
    if (!this.blockerCard && !this.description) {
      return;
    }

    const result$ = this.blockerId
      ? this.cardEditorService.editBlocker(this.cardId, this.blockerId, this.description)
      : this.cardEditorService.addBlocker(this.cardId, this.blockerCard?.id, this.description);

    this.isLoading = true;
    result$
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(r => {
        this.modal.close(r);
      });
  }
}
