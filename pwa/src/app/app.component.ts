import { AfterViewInit, Component, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
import { NewCardDialogComponent } from './dialogs/card-editor-dialog/new-card-dialog.component';
import { CardEditorComponent } from './components/card-editor/card-editor.component';
import { Setting } from './models/setting';
import { TypeaheadComponent } from './components/typeahead/typeahead.component';
import { CardSearchInputComponent } from './components/card-search-input/card-search-input.component';
import { DialogService } from './services/dialog.service';
import { ToastContainerComponent } from './components/toast/toast-container/toast-container.component';
import PullToRefresh from 'pulltorefreshjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingService } from './services/setting.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TimeDotsComponent, CardComponent, BoardComponent, PageHeaderComponent, BoardPageComponent, MdEditorComponent, FormsModule, NewCardDialogComponent, CardEditorComponent, TypeaheadComponent, CardSearchInputComponent, ToastContainerComponent, NgOptimizedImage],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  protected isLoading: boolean = false;
  protected isFirstRouteReached: boolean = false;

  public constructor(
    private router: Router,
    private settingService: SettingService,
    private dialogService: DialogService,
    private modal: NgbModal
  ) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        setTimeout(() => {
          this.isLoading = true;
        }, 1);
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        setTimeout(() => {
          this.isFirstRouteReached = true;
          this.isLoading = false;
        }, 1);

        if (event.url.startsWith('/board') || event.url.startsWith('/card')) {
          settingService.setSetting(Setting.LastURL, event.url).subscribe();
        }
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'KeyG' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.dialogService
        .searchCard()
        .pipe(
          filter(card => !!card)
        )
        .subscribe();
    }
  }

  public ngAfterViewInit(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    PullToRefresh.init({
      mainElement: 'body',
      onRefresh() {
        self.router.navigateByUrl(self.router.url, {
          onSameUrlNavigation: 'reload'
        });
      },
      shouldPullToRefresh() {
        return !self.modal.hasOpenModals() && window.scrollY <= 0;
      }
    });
  }
}
