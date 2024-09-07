import { Component, ContentChild, EventEmitter, HostListener, inject, Input, Output, TemplateRef } from '@angular/core';
import { CurrentUserComponent } from '../current-user/current-user.component';
import { NgIf, NgOptimizedImage, NgStyle, NgTemplateOutlet } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { filter, switchMap } from 'rxjs';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { NgbDropdownToggle, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CurrentBoardService } from '../../services/current-board.service';
import { DraftCardEditorService } from '../../services/implementations/draft-card-editor.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CurrentUserComponent,
    NgOptimizedImage,
    NgIf,
    NgTemplateOutlet,
    InlineMemberComponent,
    NgbDropdownToggle,
    NgStyle,
    NgbTooltip
  ],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly window = window

  @Input()
  title?: string

  @Output()
  switchBoard = new EventEmitter<{spaceId: number, boardId: number}>()

  @ContentChild('content')
  contentTemplate: TemplateRef<any>;

  @ContentChild('controls')
  controlsTemplate: TemplateRef<any>;

  constructor(
    private dialogService: DialogService,
    private currentBoardService: CurrentBoardService,
    private router: Router
  ) {
  }

  searchBoard() {
    this.dialogService.searchBoard()
      .pipe(filter(r => !!r))
      .subscribe(r => this.switchBoard.emit(r));
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.code === 'KeyK' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.searchBoard();
    }
  }

  searchCard() {
    this.dialogService.searchCard().subscribe();
  }

  createCard() {
    this.dialogService
      .createCard(this.currentBoardService.boardId, this.currentBoardService.laneId)
      .subscribe(id => this.router.navigate(['card', id]));
  }
}
