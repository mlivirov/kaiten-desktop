import { Component, Inject } from '@angular/core';
import { CardEx } from '../../models/card-ex';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardEditorComponent } from '../../components/card-editor/card-editor.component';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { Board } from '../../models/board';
import { CurrentBoardService } from '../../services/current-board.service';
import { DialogService } from '../../services/dialog.service';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-card-page',
  standalone: true,
  imports: [
    CardEditorComponent,
    CurrentUserComponent,
    NgIf,
    NgOptimizedImage,
    PageHeaderComponent,
    NgTemplateOutlet,
    RouterLink,
    CardSearchInputComponent
  ],
  templateUrl: './card-page.component.html',
  styleUrl: './card-page.component.scss'
})
export class CardPageComponent {
  card: CardEx;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private currentBoardService: CurrentBoardService,
    private dialogService: DialogService,
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService
  ) {
    this.activatedRoute.data.subscribe(data => {
      this.card = data['card'];
      this.currentBoardService.boardId = this.card.board_id;
      this.currentBoardService.laneId = this.card.lane_id;
    });
  }

  switchBoard(spaceId: number, boardId: number, cardId?: number) {
    this.router.navigate(['board', boardId], {
      fragment: cardId?.toString(),
    });
  }

  deleteCard(id: number) {
    this.dialogService
      .confirmation('Are you sure you want to delete this card?')
      .pipe(
        filter(t => !!t),
        switchMap(() => this.cardEditorService.deleteCard(id)),
      )
      .subscribe(() => {
        this.router.navigate(['board', this.card.board_id]);
      });
  }
}
