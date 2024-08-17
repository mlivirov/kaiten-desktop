import { Component } from '@angular/core';
import { Space } from '../../models/space';
import { ApiService } from '../../services/api.service';
import { InputFromEventFunction } from '../../functions/input-from-event.function';
import { NgForOf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-search-board-dialog',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './search-board-dialog.component.html',
  styleUrl: './search-board-dialog.component.scss'
})
export class SearchBoardDialogComponent {
  InputFromEventFunction = InputFromEventFunction;

  allSpaces: Space[] = [];
  filteredSpaces: Space[] = [];

  constructor(
    private apiService: ApiService,
    private modal: NgbActiveModal,
  ) {
    apiService
      .getSpaces()
      .subscribe(spaces => this.allSpaces = this.filteredSpaces = spaces);
  }

  filter(term: string) {
    this.filteredSpaces = [];
    for (const space of this.allSpaces) {
      if (!space.boards) {
        continue;
      }

      const matchedBoards = term === '' || term === null
        ? space.boards
        : space.boards.filter(b => b.title.toLowerCase().indexOf(term.toLowerCase()) !== -1);

      if (matchedBoards.length) {
        this.filteredSpaces.push({
          ...space,
          boards: [...matchedBoards]
        });
      }
    }
  }

  switchBoard(spaceId: number, boardId: number) {
    this.modal.close({spaceId, boardId});
  }
}
