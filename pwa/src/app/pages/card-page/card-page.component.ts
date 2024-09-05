import { Component } from '@angular/core';
import { CardEx } from '../../models/card-ex';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardEditorComponent } from '../../components/card-editor/card-editor.component';
import { CurrentUserComponent } from '../../components/current-user/current-user.component';
import { NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CardSearchInputComponent } from '../../components/card-search-input/card-search-input.component';

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

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    this.activatedRoute.data.subscribe(data => this.card = data['card']);
  }

  switchBoard(spaceId: number, boardId: number, cardId?: number) {
    this.router.navigate(['board', boardId], {
      queryParams: {
        cardId
      }
    });
  }
}
