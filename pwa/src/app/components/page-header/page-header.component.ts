import { Component, ContentChild, EventEmitter, HostListener, Input, Output, TemplateRef } from '@angular/core';
import { CurrentUserComponent } from '../current-user/current-user.component';
import { NgIf, NgOptimizedImage, NgStyle, NgTemplateOutlet } from '@angular/common';
import { DialogService } from '../../services/dialogService';
import { filter } from 'rxjs';
import { InlineMemberComponent } from '../inline-member/inline-member.component';
import { NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

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
    NgStyle
  ],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input()
  title?: string

  @Output()
  switchBoard = new EventEmitter<{spaceId: number, boardId: number}>()

  @ContentChild('content')
  contentTemplate: TemplateRef<any>;

  panDown: number = 0;

  constructor(
    private dialogService: DialogService,
    private router: Router,
  ) {
  }

  search() {
    this.dialogService.searchBoard()
      .pipe(filter(r => !!r))
      .subscribe(r => this.switchBoard.emit(r));
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.code === 'KeyK' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.search();
    }
  }

  searchCard() {
    this.dialogService.searchCard().subscribe();
  }

  @HostListener('pandown', ['$event'])
  @HostListener('panup', ['$event'])
  handlePanDown(event: { deltaY: number }) {
    this.panDown = event.deltaY;
  }

  @HostListener('panend', ['$event'])
  handlePanEnd(event: { deltaY: number }) {
    this.panDown = 0;

    if (event.deltaY > 130) {
      this.router.navigateByUrl(this.router.url, {
        onSameUrlNavigation: 'reload'
      });
    }
  }

  @HostListener('pancancel', ['$event'])
  handlePanCancel() {
    this.panDown = 0;
  }
}
