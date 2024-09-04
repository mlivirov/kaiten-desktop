import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, JsonPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { AvatarService } from '../../services/avatar.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-inline-member',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    JsonPipe,
    AsyncPipe,
    NgbPopover,
    NgbTooltip
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
  profileId: any = null;

  @Input()
  showAvatar: boolean = true;

  @Input()
  showName: boolean = true;

  avatarUrl?: string;

  isLoading: boolean = false;

  constructor(private avatarService: AvatarService, private apiService: ApiService) {
  }

  loadAvatarUrl(): void {
    this.isLoading = true;
    this.avatarService
      .getUrl(this.profile)
      .pipe(
        finalize(() => this.isLoading = false),
      )
      .subscribe(url => {
        this.avatarUrl = url;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.profileUid) {
      this.isLoading = true;
      this.apiService
        .getUserByUid(this.profileUid)
        .pipe(
          finalize(() => this.isLoading = false),
        )
        .subscribe(d => {
          this.profile = d;
          this.loadAvatarUrl();
        });
    }

    if (this.profileId) {
      this.isLoading = true;
      this.apiService
        .getUserById(this.profileId)
        .pipe(
          finalize(() => this.isLoading = false),
        )
        .subscribe(d => {
          this.profile = d;
          this.loadAvatarUrl();
        });
    }

    if (this.profile) {
      this.loadAvatarUrl();
    }
  }
}
