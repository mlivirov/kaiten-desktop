import { Component, Inject } from '@angular/core';
import { CardEx } from '../../models/card-ex';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardEditorComponent } from '../../components/card-editor/card-editor.component';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';
import { CurrentBoardService } from '../../services/current-board.service';
import { DialogService } from '../../services/dialog.service';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';

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
  protected card: CardEx;

  public constructor(
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

  protected openBoard(boardId: number, cardId?: number): void {
    this.router.navigate(['board', boardId], {
      fragment: cardId ? cardId?.toString() : undefined,
    });
  }
}
