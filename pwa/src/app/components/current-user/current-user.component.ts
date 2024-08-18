import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { User } from '../../models/user';
import { ApiService } from '../../services/api.service';
import { AvatarService } from '../../services/avatar.service';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-current-user',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    AsyncPipe
  ],
  templateUrl: './current-user.component.html',
  styleUrl: './current-user.component.scss'
})
export class CurrentUserComponent {
  profile?: User;
  avatarUrl?: string;

  constructor(
    private apiService: ApiService,
    private avatarService: AvatarService,
    private router: Router
  ) {
    apiService
      .getCurrentUser()
      .subscribe(user => {
        this.profile = user;
        this.loadAvatarUrl();
      });
  }

  logout() {
    this.apiService.setCredentials({});
    this.router.navigate(['login']);
  }

  loadAvatarUrl(): void {
    this.avatarService
      .getUrl(this.profile)
      .subscribe(url => {
        this.avatarUrl = url;
      });
  }
}
