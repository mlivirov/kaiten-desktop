import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
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
import { TextEditorComponent, TextEditorSaveEvent } from '../../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../services/card-editor.service';
import { AuthService } from '../../../services/auth.service';

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
    TimeagoModule,
    TextEditorComponent
  ],
  templateUrl: './card-comments.component.html',
  styleUrl: './card-comments.component.scss'
})
export class CardCommentsComponent implements OnChanges {
  CardCommentType = CardCommentType;

  @Input()
  cardId: number;

  comments: CardComment[] = [];
  currentUser: User;
  text: string;
  isSavingInProgress: boolean = false;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService) {
    this.authService
      .getCurrentUser()
      .subscribe(currentUser => this.currentUser = currentUser );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.cardId) {
      this.loadComments();
    }
  }

  submit() {
    if (this.isSavingInProgress) {
      return;
    }

    this.isSavingInProgress = true;
    this.cardEditorService
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
    this.isLoading = true;
    this.cardEditorService
      .getCardComments(this.cardId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(d => {
        this.comments = d.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      });
  }

  update(comment: CardComment, event: TextEditorSaveEvent) {
    if (this.isSavingInProgress) {
      return;
    }

    this.isSavingInProgress = true;
    this.cardEditorService
      .updateComment(this.cardId, comment.id, event.value)
      .pipe(
        finalize(() => this.isSavingInProgress = false),
      )
      .subscribe(updated => {
        event.commit();
        Object.assign(comment, updated);
        comment.author = this.currentUser;
      });
  }
}
