import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CardComment, CardCommentType } from '../../../models/card-comment';
import { MdEditorComponent } from '../../md-editor/md-editor.component';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { InlineMemberComponent } from '../../inline-member/inline-member.component';
import { MdViewerComponent } from '../../md-viewer/md-viewer.component';
import { TimeagoModule } from 'ngx-timeago';
import { User } from '../../../models/user';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-card-comments',
  standalone: true,
  imports: [
    MdEditorComponent,
    NgForOf,
    NgIf,
    FormsModule,
    InlineMemberComponent,
    MdViewerComponent,
    TimeagoModule
  ],
  templateUrl: './card-comments.component.html',
  styleUrl: './card-comments.component.scss'
})
export class CardCommentsComponent implements OnChanges {
  CardCommentType = CardCommentType;
  @Input() cardId: number;
  comments: CardComment[] = [];
  currentUser: User;

  text: string;
  isSavingInProgress: boolean = false;

  constructor(private apiService: ApiService) {
    this.apiService.getCurrentUser().subscribe(currentUser => { this.currentUser = currentUser; });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.cardId) {
      this.loadComments();
    }
  }

  submit() {
    this.isSavingInProgress = true;

    this.apiService
      .addComment(this.cardId, this.text)
      .pipe(
        finalize(() => this.isSavingInProgress = false),
      )
      .subscribe(comment => {
        comment.author = this.currentUser;
        this.comments.splice(0, 0, comment);
        this.text = null;
      });
  }

  loadComments() {
    this.apiService
      .getCardComments(this.cardId)
      .subscribe(d => {
        this.comments = d.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      });
  }
}
