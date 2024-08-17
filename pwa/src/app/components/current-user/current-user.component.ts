import { Component } from '@angular/core';
import { User } from '../../models/user';
import { ApiService } from '../../services/api.service';
import { AvatarService } from '../../services/avatar.service';
import { NgOptimizedImage } from '@angular/common';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-current-user',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle
  ],
  templateUrl: './current-user.component.html',
  styleUrl: './current-user.component.scss'
})
export class CurrentUserComponent {
  profile?: User;

  get avatarUrl() {
    return this.avatarService.getUrl(this.profile);
  }

  constructor(
    private apiService: ApiService,
    private avatarService: AvatarService,
    private router: Router
  ) {
    apiService
      .getCurrentUser()
      .subscribe(user => {
        this.profile = user;
      })
  }

  logout() {
    this.router.navigate(['login']);
  }
}
