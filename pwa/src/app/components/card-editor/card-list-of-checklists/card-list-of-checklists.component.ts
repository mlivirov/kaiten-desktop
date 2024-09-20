import { Component, Inject, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CardEx } from '../../../models/card-ex';
import { CardChecklistComponent } from './card-checklist/card-checklist.component';
import { NgForOf } from '@angular/common';
import { CheckList } from '../../../models/check-list';
import { filter, finalize } from 'rxjs';
import { DialogService } from '../../../services/dialog.service';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../services/card-editor.service';
import { nameof } from '../../../functions/name-of';

@Component({
  selector: 'app-card-list-of-checklists',
  standalone: true,
  imports: [
    CardChecklistComponent,
    NgForOf
  ],
  templateUrl: './card-list-of-checklists.component.html',
  styleUrl: './card-list-of-checklists.component.scss'
})
export class CardListOfChecklistsComponent implements OnChanges {
  @Input() public card: CardEx;
  protected isSaving = false;
  @ViewChildren(CardChecklistComponent) protected checklists: QueryList<CardChecklistComponent> = new QueryList<CardChecklistComponent>();

  public constructor(
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    private dialogService: DialogService
  ) {
  }

  protected deleteList(checklist: CheckList): void {
    this.dialogService
      .confirmation('Are you sure you want to delete the checklist and all it\'s content?')
      .pipe(
        filter(t => !!t)
      )
      .subscribe(this.doDelete.bind(this, checklist));
  }

  private doDelete(checklist: CheckList): void {
    this.isSaving = true;
    this.cardEditorService
      .deleteCheckList(this.card.id, checklist.id)
      .pipe(
        finalize(() => this.isSaving = false),
      )
      .subscribe(() => {
        const indexToDelete = this.card.checklists.indexOf(checklist);
        this.card.checklists.splice(indexToDelete, 1);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardListOfChecklistsComponent>('card')]) {
      this.card.checklists?.sort((a: CheckList, b: CheckList) => a.sort_order - b.sort_order);
    }
  }

  public openTextEditor(checklistId: number): void {
    const checklist = this.checklists.find(t => t.checklist.id == checklistId);
    checklist?.openTextEditor();
  }
}
