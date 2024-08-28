import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { BoardComponent } from '../../components/board/board.component';
import { Board } from '../../models/board';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFromEventFunction } from '../../functions/input-from-event.function';
import { NgIf } from '@angular/common';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { FormsModule } from '@angular/forms';

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
  title: string;
  boardId: number;

  @ViewChild('cardSearchInput', { read: CardSearchInputComponent })
  cardSearchInput: CardSearchInputComponent;

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

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyF' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.cardSearchInput.typeahead.input.nativeElement.focus();
    }
  }
}
