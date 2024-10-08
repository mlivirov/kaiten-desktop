import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, JsonPipe, NgClass, NgIf, NgOptimizedImage, NgStyle } from '@angular/common';
import { AvatarService } from '../../services/avatar.service';
import { User } from '../../models/user';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { UserService } from '../../services/user.service';
import { nameof } from '../../functions/name-of';
import { getTextOrDefault } from '../../functions/get-text-or-default';

@Component({
  selector: 'app-inline-member',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    JsonPipe,
    AsyncPipe,
    NgbPopover,
    NgbTooltip,
    NgStyle,
    NgClass
  ],
  templateUrl: './inline-member.component.html',
  styleUrl: './inline-member.component.scss'
})
export class InlineMemberComponent implements OnChanges {
  @Input() public profile?: User;
  @Input() public profileUid?: string;
  @Input() public profileId?: number;
  @Input() public showAvatar: boolean = true;
  @Input() public showName: boolean = true;
  @Input() public size: number = 24;
  @Input() public active: boolean = false;
  protected avatarUrl?: string;
  protected isLoading: boolean = false;
  protected readonly getTextOrDefault = getTextOrDefault;

  public constructor(
    private avatarService: AvatarService,
    private userService: UserService
  ) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<InlineMemberComponent>('profileUid')] && this.profileUid) {
      this.isLoading = true;
      this.userService
        .getUserByUid(this.profileUid)
        .pipe(
          finalize(() => this.isLoading = false),
        )
        .subscribe(d => {
          this.profile = d;
          this.loadAvatarUrl();
        });
    }

    if (changes[nameof<InlineMemberComponent>('profileId')] && this.profileId) {
      this.isLoading = true;
      this.userService
        .getUserById(this.profileId)
        .pipe(
          finalize(() => this.isLoading = false),
        )
        .subscribe(d => {
          this.profile = d;
          this.loadAvatarUrl();
        });
    }

    if (this.profile?.id > 0) {
      this.loadAvatarUrl();
    }
  }

  private loadAvatarUrl(): void {
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
}
