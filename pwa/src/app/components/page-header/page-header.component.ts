import {
  Component, ContentChild, ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output, QueryList,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CurrentUserComponent } from '../current-user/current-user.component';
import { InputFromEventFunction } from '../../functions/input-from-event.function';
import { NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { DialogService } from '../../services/dialogService';
import { filter } from 'rxjs';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CurrentUserComponent,
    NgOptimizedImage,
    NgIf,
    NgTemplateOutlet
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

  constructor(private dialogService: DialogService) {
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
}
