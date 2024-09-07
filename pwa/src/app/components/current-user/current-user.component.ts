import { Component, Input } from '@angular/core';
import { User } from '../../models/user';
import { ApiService } from '../../services/api.service';
import { AvatarService } from '../../services/avatar.service';
import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-current-user',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    AsyncPipe,
    NgIf
  ],
  templateUrl: './current-user.component.html',
  styleUrl: './current-user.component.scss'
})
export class CurrentUserComponent {
  profile?: User;
  avatarUrl?: string;

  @Input()
  showText: boolean = true;

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService,
    private router: Router,
    private dialogService: DialogService,
  ) {
    authService
      .getCurrentUser()
      .subscribe(user => {
        this.profile = user;
        this.loadAvatarUrl();
      });
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
}
