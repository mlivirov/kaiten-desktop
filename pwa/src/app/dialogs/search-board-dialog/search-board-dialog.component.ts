import { Component } from '@angular/core';
import { Space } from '../../models/space';
import { ApiService } from '../../services/api.service';
import { InputFromEventFunction } from '../../functions/input-from-event.function';
import { NgForOf, NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-search-board-dialog',
  standalone: true,
  imports: [
    NgForOf,
    CardSearchInputComponent,
    NgIf
  ],
  templateUrl: './search-board-dialog.component.html',
  styleUrl: './search-board-dialog.component.scss'
})
export class SearchBoardDialogComponent {
  InputFromEventFunction = InputFromEventFunction;

  allSpaces: Space[] = [];
  filteredSpaces: Space[] = [];
  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    public modal: NgbActiveModal,
  ) {
    this.isLoading = true;
    apiService
      .getSpaces()
      .pipe(
        finalize(() => this.isLoading = false)
      )
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
