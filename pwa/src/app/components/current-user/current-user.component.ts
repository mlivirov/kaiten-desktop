import { Component, Input } from '@angular/core';
import { User } from '../../models/user';
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
  @Input() public showText: boolean = true;
  protected profile?: User;
  protected avatarUrl?: string;
  protected currentTheme: Theme;

  public constructor(
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
      .currentTheme
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(theme => this.currentTheme = theme);
  }

  protected logout(): void {
    this.authService.logout().subscribe(
      () => this.router.navigate(['login'])
    );
  }

  protected searchCard(): void {
    this.dialogService.searchCard().subscribe();
  }

  protected setTheme(theme: Theme): void {
    this.themeManagerService.setTheme(theme).subscribe();
  }

  private loadAvatarUrl(): void {
    this.avatarService
      .getUrl(this.profile)
      .subscribe(url => {
        this.avatarUrl = url;
      });
  }
  
}
