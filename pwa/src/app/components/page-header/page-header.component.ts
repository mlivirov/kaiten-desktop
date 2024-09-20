import { Component, ContentChild, EventEmitter, HostListener, Input, Output, TemplateRef } from '@angular/core';
import { CurrentUserComponent } from '../current-user/current-user.component';
import { NgIf, NgOptimizedImage, NgStyle, NgTemplateOutlet } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { filter } from 'rxjs';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { NgbDropdownToggle, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CurrentBoardService } from '../../services/current-board.service';

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
  @Input() public title?: string;
  @Output() protected switchBoard = new EventEmitter<{spaceId: number, boardId: number}>();
  @ContentChild('content') protected contentTemplate: TemplateRef<unknown>;
  @ContentChild('controls') protected controlsTemplate: TemplateRef<unknown>;

  public constructor(
    private dialogService: DialogService,
    private currentBoardService: CurrentBoardService,
    private router: Router
  ) {
  }

  protected searchBoard(): void {
    this.dialogService.searchBoard()
      .pipe(filter(r => !!r))
      .subscribe(r => this.switchBoard.emit(r));
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyK' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.searchBoard();
    }
  }

  protected searchCard(): void {
    this.dialogService.searchCard().subscribe();
  }

  protected createCard(): void {
    this.dialogService
      .createCard(this.currentBoardService.boardId, this.currentBoardService.laneId)
      .subscribe(id => this.router.navigate(['card', id]));
  }
}
