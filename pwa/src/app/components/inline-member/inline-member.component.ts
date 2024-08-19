import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, JsonPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { AvatarService } from '../../services/avatar.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-inline-member',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    JsonPipe,
    AsyncPipe
  ],
  templateUrl: './inline-member.component.html',
  styleUrl: './inline-member.component.scss'
})
export class InlineMemberComponent implements OnChanges {
  @Input()
  profile: User = null;

  @Input()
  profileUid: any = null;

  @Input()
  showAvatar: boolean = true;

  @Input()
  showName: boolean = true;

  avatarUrl?: string;

  constructor(private avatarService: AvatarService, private apiService: ApiService) {
  }

  loadAvatarUrl(): void {
    this.avatarService
      .getUrl(this.profile)
      .subscribe(url => {
        this.avatarUrl = url;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.profileUid) {
      this.apiService.getUserByUid(this.profileUid).subscribe(d => {
        this.profile = d;
        this.loadAvatarUrl();
      });
    }

    if (this.profile) {
      this.loadAvatarUrl();
    }
  }
}
