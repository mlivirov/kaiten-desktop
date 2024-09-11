import { Component, HostListener, ViewChild } from '@angular/core';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { BoardComponent } from '../../components/board/board.component';
import { Board, BoardBase } from '../../models/board';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';
import { CardEx } from '../../models/card-ex';
import { ColumnEx } from '../../models/column-ex';
import { CurrentBoardService } from '../../services/current-board.service';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CurrentUserComponent,
    PageHeaderComponent,
    BoardComponent,
    NgIf,
    CardSearchInputComponent,
    FormsModule
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss'
})
export class BoardPageComponent {
  board: BoardBase;
  boardCards: CardEx[] = [];
  boardColumns: ColumnEx[] = [];

  @ViewChild('cardSearchInput', { read: CardSearchInputComponent })
  cardSearchInput: CardSearchInputComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private currentBoardService: CurrentBoardService,
  ) {
    activatedRoute
      .data
      .subscribe(data => {
        this.board = data['board'];
        this.boardCards = data['cards'];
        this.boardColumns = data['columns'];

        this.currentBoardService.boardId = this.board.id;
        this.currentBoardService.laneId = null;
      });
  }

  openCard(id: number) {
    this.router.navigate(['board', this.board.id], {
      fragment: id.toString(),
      onSameUrlNavigation: 'ignore',
    }).then(() => this.router.navigate(['card', id]));
  }

  switchBoard(spaceId: number, boardId: number) {
    this.router.navigate(['board', boardId]);
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput.typeahead.input.nativeElement.focus();
    }
  }
}
