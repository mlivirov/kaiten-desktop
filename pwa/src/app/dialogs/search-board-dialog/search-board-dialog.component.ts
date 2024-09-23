import { Component, Injectable } from '@angular/core';
import { inputFromEvent } from '../../functions/input-from-event';
import { NgForOf, NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { finalize } from 'rxjs';
import { BoardService } from '../../services/board.service';
import { SpaceBoardPermissions } from '../../models/space-board-permissions';
import { FormsModule } from '@angular/forms';

export interface SpaceBoardPermissionsViewModel extends SpaceBoardPermissions {
  full_title: string;
}

@Injectable({ providedIn: 'root' })
class SearchBoardDialogService {
  public lastFilterTerm?: string;
}

@Component({
  selector: 'app-search-board-dialog',
  standalone: true,
  imports: [
    NgForOf,
    CardSearchInputComponent,
    NgIf,
    FormsModule
  ],
  templateUrl: './search-board-dialog.component.html',
  styleUrl: './search-board-dialog.component.scss'
})
export class SearchBoardDialogComponent {
  protected readonly InputFromEventFunction = inputFromEvent;
  protected filteredBoard: SpaceBoardPermissionsViewModel[] = [];
  protected isLoading: boolean = false;
  protected filterTerm?: string;
  private allBoards: SpaceBoardPermissionsViewModel[] = [];

  public constructor(
    private boardService: BoardService,
    public modal: NgbActiveModal,
    private searchBoardDialogService: SearchBoardDialogService
  ) {
    this.isLoading = true;
    boardService
      .getSpaces()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(spaces => {
        const spaceById = spaces.reduce((acc, space) => {
          acc[space.id] = space;
          return acc;
        }, {});

        const boardsMap = spaces
          .filter(t => t.boards?.length)
          .flatMap(t => t.boards)
          .reduce((acc, board) => {
            const viewModel = <SpaceBoardPermissionsViewModel>{
              ...board,
              full_title: `${spaceById[board.space_id].title} / ${board.title}`,
            };
            acc[viewModel.id] = viewModel;
            return acc;
          }, {});

        this.allBoards = Object.values(boardsMap);
        this.allBoards.sort((a, b) => a.title.localeCompare(b.title));

        this.filter(this.searchBoardDialogService.lastFilterTerm);
      });
  }

  protected filter(term?: string): void {
    this.filterTerm = term;
    this.searchBoardDialogService.lastFilterTerm = term;
    if (typeof term === 'string') {
      this.filteredBoard = this.allBoards.filter(b => b.title.toLowerCase().indexOf(term?.toLowerCase()) !== -1);
    } else {
      this.filteredBoard = this.allBoards;
    }
  }

  protected switchBoard(spaceId: number, boardId: number): void {
    this.modal.close({spaceId, boardId});
  }
}
