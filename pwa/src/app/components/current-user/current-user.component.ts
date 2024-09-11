import { Component, Input } from '@angular/core';
import { User } from '../../models/user';
import { FileService } from '../../services/file.service';
import { AvatarService } from '../../services/avatar.service';
import { AsyncPipe, JsonPipe, NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { AuthService } from '../../services/auth.service';
import { Theme, ThemeManagerService } from '../../services/theme-manager.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-current-user',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    AsyncPipe,
    NgIf,
    NgbPopover,
    NgClass,
    JsonPipe,
    NgbTooltip
  ],
  templateUrl: './current-user.component.html',
  styleUrl: './current-user.component.scss'
})
export class CurrentUserComponent {
  profile?: User;
  avatarUrl?: string;
  currentTheme: Theme;

  @Input()
  showText: boolean = true;

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService,
    private router: Router,
    private dialogService: DialogService,
    private themeManagerService: ThemeManagerService,
  ) {
    authService
      .getCurrentUser()
      .subscribe(user => {
        this.profile = user;
        this.loadAvatarUrl();
      });

    this.themeManagerService
      .currentTheme$
      // .pipe(
      //   takeUntilDestroyed()
      // )
      .subscribe(theme => this.currentTheme = theme);
  }

  logout() {
    this.authService.logout().subscribe(
      () => this.router.navigate(['login'])
    );
  }

  loadAvatarUrl(): void {
    this.avatarService
      .getUrl(this.profile)
      .subscribe(url => {
        this.avatarUrl = url;
      });
  }

  searchCard() {
    this.dialogService.searchCard().subscribe();
  }

  setTheme(theme: Theme) {
    this.themeManagerService.setTheme(theme).subscribe();
  }
}
