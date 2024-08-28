import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet
} from '@angular/router';
import { TimeDotsComponent } from './components/time-dots/time-dots.component';
import { CardComponent } from './components/card/card.component';
import { BoardComponent } from './components/board/board.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { BoardPageComponent } from './pages/board-page/board-page.component';
import { MdEditorComponent } from './components/md-editor/md-editor.component';
import { FormsModule } from '@angular/forms';
import { CardEditorDialogComponent } from './dialogs/card-editor-dialog/card-editor-dialog.component';
import { CardEditorComponent } from './components/card-editor/card-editor.component';
import { ApiService } from './services/api.service';
import { Setting } from './models/setting';
import { TypeaheadComponent } from './components/typeahead/typeahead.component';
import { CardSearchInputComponent } from './components/card-search-input/card-search-input.component';
import { DialogService } from './services/dialogService';
import { ToastContainerComponent } from './components/toast/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TimeDotsComponent, CardComponent, BoardComponent, PageHeaderComponent, BoardPageComponent, MdEditorComponent, FormsModule, CardEditorDialogComponent, CardEditorComponent, TypeaheadComponent, CardSearchInputComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private dialogService: DialogService,
  ) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isLoading = false;

        if (event.url.startsWith('/board')) {
          apiService.setSetting(Setting.LastURL, event.url).subscribe();
        }
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyG' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.dialogService
        .searchCard()
        .subscribe(t => this.router.navigate(['card', t.id]));
    }
  }
}
