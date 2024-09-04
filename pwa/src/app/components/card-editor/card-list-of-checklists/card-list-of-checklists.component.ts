import { Component, Input, OnChanges, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CardEx } from '../../../models/card-ex';
import { CardChecklistComponent } from './card-checklist/card-checklist.component';
import { NgForOf } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { CheckList } from '../../../models/check-list';
import { filter, finalize } from 'rxjs';
import { DialogService } from '../../../services/dialogService';

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
  @Input()
  card: CardEx;

  isSaving = false;

  @ViewChildren(CardChecklistComponent)
  checklists: QueryList<CardChecklistComponent> = new QueryList<CardChecklistComponent>();

  constructor(private apiService: ApiService, private dialogService: DialogService) {
  }

  deleteList(checklist: CheckList) {
    this.dialogService
      .confirmation('Are you sure you want to delete the checklist and all it\'s content?')
      .pipe(
        filter(t => !!t)
      )
      .subscribe(this.doDelete.bind(this, checklist));
  }

  doDelete(checklist: CheckList) {
    this.isSaving = true;
    this.apiService.deleteCheckList(this.card.id, checklist.id)
      .pipe(
        finalize(() => this.isSaving = false),
      )
      .subscribe(() => {
        const indexToDelete = this.card.checklists.indexOf(checklist);
        this.card.checklists.splice(indexToDelete, 1);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.card.checklists?.sort((a: CheckList, b: CheckList) => a.sort_order - b.sort_order);
  }
}
