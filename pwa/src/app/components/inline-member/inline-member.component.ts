import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { JsonPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { AvatarService } from '../../services/avatar.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-inline-member',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    JsonPipe
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

  get avatarUrl() {
    return this.avatarService.getUrl(this.profile);
  }

  constructor(private avatarService: AvatarService, private apiService: ApiService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.profileUid) {
      this.apiService.getUserByUid(this.profileUid).subscribe(d => this.profile = d);
    }
  }
}
