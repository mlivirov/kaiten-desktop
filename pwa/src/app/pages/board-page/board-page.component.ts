import { Component } from '@angular/core';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { BoardComponent } from '../../components/board/board.component';
import { Board } from '../../models/board';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CurrentUserComponent,
    PageHeaderComponent,
    BoardComponent
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss'
})
export class BoardPageComponent {
  title: string;
  boardId: number;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute
      .data
      .subscribe(data => {
        const board: Board = data['board'];
        this.title = board.title;
        this.boardId = board.id;
      });
  }

  switchBoard(spaceId: number, boardId: number) {
    this.router.navigate(['board', boardId]);
  }
}
