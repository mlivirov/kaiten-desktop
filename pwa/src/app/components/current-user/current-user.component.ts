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
import { SettingService } from '../../services/setting.service';
import { LinkCopyStyle, Setting } from '../../models/setting';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

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
    NgbTooltip,
    FormsModule
  ],
  templateUrl: './current-user.component.html',
  styleUrl: './current-user.component.scss'
})
export class CurrentUserComponent {
  @Input() public showText: boolean = true;
  protected readonly LinkCopyStyle = LinkCopyStyle;
  protected profile?: User;
  protected avatarUrl?: string;
  protected currentTheme: Theme;
  protected isLoading: boolean = false;
  protected linkCopyStyle?: LinkCopyStyle;

  public constructor(
    private authService: AuthService,
    private avatarService: AvatarService,
    private router: Router,
    private dialogService: DialogService,
    private themeManagerService: ThemeManagerService,
    private settingService: SettingService
  ) {
    this.isLoading = true;
    forkJoin({
      profileAndAvatar: authService.getCurrentUser()
        .pipe(
          switchMap(profile => forkJoin({
            profile: of(profile),
            avatar: avatarService.getUrl(profile)
          }))),
      linkCopyStyle: this.settingService.getSetting(Setting.LinkCopyStyle)
    })
      .pipe(
        finalize(() => this.isLoading = false),
      )
      .subscribe(({profileAndAvatar, linkCopyStyle}) => {
        this.profile = profileAndAvatar.profile;
        this.avatarUrl = profileAndAvatar.avatar;

        if (linkCopyStyle === LinkCopyStyle.CLIENT) {
          this.linkCopyStyle = LinkCopyStyle.CLIENT;
        } else {
        // kaiten style is used when setting is not set
          this.linkCopyStyle = LinkCopyStyle.KAITEN;
        }
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

  protected setLinkCopyStyle(linkCopyStyle: LinkCopyStyle): void {
    this.linkCopyStyle = linkCopyStyle;
    this.settingService.setSetting(Setting.LinkCopyStyle, linkCopyStyle).subscribe();
  }
}
