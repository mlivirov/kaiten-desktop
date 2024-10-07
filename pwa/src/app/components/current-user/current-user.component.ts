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
import { BoardCardLifetimeStyle, BoardStyle, DefaultSettings, LinkCopyStyle, Setting } from '../../models/setting';
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
  protected readonly BoardStyle = BoardStyle;
  protected readonly LinkCopyStyle = LinkCopyStyle;
  protected readonly BoardCardLifetimeStyle = BoardCardLifetimeStyle;
  protected profile?: User;
  protected avatarUrl?: string;
  protected currentTheme: Theme;
  protected isLoading: boolean = false;
  protected linkCopyStyle?: LinkCopyStyle;
  protected boardStyle?: BoardStyle;
  protected boardCardLifetimeStyle?: BoardCardLifetimeStyle;

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
      linkCopyStyle: this.settingService.getSetting<LinkCopyStyle>(Setting.LinkCopyStyle, DefaultSettings.LinkCopyStyle),
      boardStyle: this.settingService.getSetting<BoardStyle>(Setting.BoardStyle, DefaultSettings.BoardStyle),
      boardCardLifetimeStyle: this.settingService.getSetting<BoardCardLifetimeStyle>(Setting.BoardCardLifetimeStyle, DefaultSettings.BoardCardLifetimeStyle)
    })
      .pipe(
        finalize(() => this.isLoading = false),
      )
      .subscribe(({profileAndAvatar, linkCopyStyle, boardStyle, boardCardLifetimeStyle}) => {
        this.profile = profileAndAvatar.profile;
        this.avatarUrl = profileAndAvatar.avatar;
        this.boardStyle = boardStyle;
        this.linkCopyStyle = linkCopyStyle;
        this.boardCardLifetimeStyle = boardCardLifetimeStyle;
      });

    this.themeManagerService
      .currentTheme
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(theme => this.currentTheme = theme);

    this.settingService
      .subscribeToChanges<BoardStyle>(Setting.BoardStyle)
      .pipe(takeUntilDestroyed())
      .subscribe(t => this.boardStyle = t);

    this.settingService
      .subscribeToChanges<BoardStyle>(Setting.BoardCardLifetimeStyle)
      .pipe(takeUntilDestroyed())
      .subscribe(t => this.boardStyle = t);
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
    this.settingService
      .setSetting(Setting.LinkCopyStyle, linkCopyStyle)
      .subscribe();
  }

  protected setBoardStyle(boardStyle: BoardStyle): void {
    this.boardStyle = boardStyle;
    this.settingService
      .setSetting(Setting.BoardStyle, boardStyle)
      .subscribe();
  }

  protected setBoardCardLifetimeStyle(boardCardLifetimeStyle: BoardCardLifetimeStyle): void {
    this.boardCardLifetimeStyle = boardCardLifetimeStyle;
    this.settingService
      .setSetting(Setting.BoardCardLifetimeStyle, boardCardLifetimeStyle)
      .subscribe();
  }
}
