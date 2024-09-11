import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CardComment, CardCommentType } from '../../../models/card-comment';
import { MdEditorComponent } from '../../md-editor/md-editor.component';
import { DatePipe, DecimalPipe, NgForOf, NgIf, NgStyle, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../../services/file.service';
import { InlineMemberComponent } from '../../inline-member/inline-member.component';
import { MdViewerComponent } from '../../md-viewer/md-viewer.component';
import { TimeagoModule } from 'ngx-timeago';
import { User } from '../../../models/user';
import { finalize, forkJoin, map } from 'rxjs';
import { TextEditorComponent, TextEditorSaveEvent } from '../../text-editor/text-editor.component';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../services/card-editor.service';
import { AuthService } from '../../../services/auth.service';
import { CardActivity } from '../../../models/card-activity';
import { getTextOrDefault } from '../../../functions/get-text-or-default.function';
import { BoardService } from '../../../services/board.service';
import { CardType } from '../../../models/card-type';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ThroughputReport, ThroughputReportService } from '../../../services/throughput-report.service';
import { CardState } from '../../../models/card-state';
import { Column } from '../../../models/column';
import { TimespanPipe } from '../../../pipes/timespan.pipe';

export interface CardCommentViewModel {
  comment_id?: number,
  author_id: number,
  author: User,
  created: Date,
  edited: boolean,
  comment_type?: CardCommentType,
  text: string,
  action: string,
  order: number,
}

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
    TextEditorComponent,
    NgbTooltip,
    DatePipe,
    NgStyle,
    DecimalPipe,
    PercentPipe,
    TimespanPipe
  ],
  templateUrl: './card-comments.component.html',
  styleUrl: './card-comments.component.scss'
})
export class CardCommentsComponent implements OnChanges {
  protected readonly CardCommentType = CardCommentType;
  protected readonly CardState = CardState;

  @Input()
  cardId: number;

  cardTypes: CardType[] = [];
  entries: CardCommentViewModel[] = [];
  comments: CardCommentViewModel[] = [];
  activities: CardCommentViewModel[] = [];
  currentUser: User;
  text: string;
  isSavingInProgress: boolean = false;
  isLoading: boolean = false;

  areCommentsVisible: boolean = true;
  areActivitiesVisible: boolean = true;
  throughputReport?: ThroughputReport;

  constructor(
    private authService: AuthService,
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    private boardService: BoardService,
    private throughputReportService: ThroughputReportService
  ) {
    this.authService
      .getCurrentUser()
      .subscribe(currentUser => this.currentUser = currentUser );
  }

  getThroughputColumnTitle(column: Column, subcolumn?: Column): string {
    let title = getTextOrDefault(column.title);

    if (subcolumn?.title?.length) {
      title += ` / ${subcolumn.title}`;
    }

    return title;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.cardId) {
      this.throughputReport = null;
      this.loadActivities();
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
        this.comments.push(this.mapCommentToModel(comment));
        this.makeEntries();
        this.text = null;
      });
  }

  makeEntries() {
    this.entries = [];
    if (this.areCommentsVisible) {
      this.entries.push(...this.comments);
    }

    if (this.areActivitiesVisible) {
      this.entries.push(...this.activities);
    }

    this.entries
      .sort((a, b) =>
        a.created.getTime() !== b.created.getTime()
          ? b.created.getTime() - a.created.getTime()
          : a.action === 'created' && b.action === 'updated'
            ? 1
            : a.action === 'updated' && b.action === 'created'
              ? -1
              : 0
      );
  }


  loadActivities() {
    this.isLoading = true;
    forkJoin({
      cardTypes: this.boardService.getCardTypes(),
      comments: this.cardEditorService.getCardComments(this.cardId),
      activities: this.cardEditorService.getCardActivity(this.cardId),
    })
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe(({cardTypes, comments, activities}) => {
        this.throughputReport = this.throughputReportService.getCardReport(activities);

        this.cardTypes = cardTypes;
        this.comments = comments.map(t => this.mapCommentToModel(t));
        this.activities = activities
          .filter(t => !['comment_add', 'comment_remove', 'comment_update'].includes(t.action))
          .map(t => this.mapActivityToModel(t));

        this.makeEntries();
      });
  }

  mapCommentToModel(comment: CardComment): CardCommentViewModel {
    return <CardCommentViewModel>{
      comment_id: comment.id,
      action: 'commented',
      author_id: comment.author_id,
      author: comment.author,
      edited: comment.edited,
      text: comment.text,
      created: new Date(comment.created),
      comment_type: comment.type
    }
  }

  getPropertyValue(val: unknown, mapper: (v) => string = (v) => v) {
    if (val === null || val === undefined) {
      return 'Not set';
    }

    if (typeof val === 'string') {
      return val
    } else if (val['id'] && val['value']) {
      return val['value'] as string;
    } else if (Array.isArray(val)) {
      return val.map(t => `${mapper(this.getPropertyValue(t))}`).join(', ');
    }

    return val;
  }

  getBlockerTextFromActivity(activity: CardActivity): string {
    let text = '';
    if (activity.data?.dump?.block?.blocker_card_id) {
      text += ` [${activity.data?.dump?.block?.blocker_card_id}](/${activity.data?.dump?.block?.blocker_card_id})`
    }

    if (activity.data?.dump?.block?.reason) {
      text += 'comment'
      text += '\n>'+activity.data?.dump?.block?.reason
    }

    return text;
  }

  getTextForRelationChanged(activity: CardActivity): string {
    const relation = activity.data.dump.parent_card || activity.data.dump.child_card;
    return `${activity.data.dump.parent_card ? 'parent' : 'child'} card [${relation?.id} - ${relation?.title}](/../card/${relation?.id})`;
  }

  getTextForTransition(activity: CardActivity): string {
    let text = `${getTextOrDefault(activity.lane.title, 'Default')}" lane`;
    text += ` of "[${activity.board.title}](/../board/${activity.board_id})"`;
    text += ` > "${getTextOrDefault(activity.column.title, activity.board.title)}"`
    if (activity.subcolumn?.title?.length) {
      text += ` > "${activity.subcolumn.title}"`
    }

    return text;
  }

  mapActivityToModel(activity: CardActivity): CardCommentViewModel {
    let text: string = `Card updated. Action: ${activity.action}`;
    if (activity.changed_field) {
      text += `, field: ${activity.changed_field}`;
    }
    let action = 'updated';

    switch (activity.action) {
      case 'card_relation_remove':
        text = `Removed ${this.getTextForRelationChanged(activity)}`;
        break;
      case 'card_relation_add':
        text = `Added ${this.getTextForRelationChanged(activity)}`;
        break;
      case 'card_add_checklist_item':
        text = `Added checklist item.\n>${activity.listItem.text}`;
        break;
      case 'card_remove_checklist_item':
        text = `Removed checklist item.\n>${activity.listItem.text}`;
        break;
      case 'card_uncheck_checklist_item':
        text = `Unchecked checklist item.\n>${activity.listItem.text}`;
        break;
      case 'card_check_checklist_item':
        text = `Checked checklist item.\n>${activity.listItem.text}`;
        break;
      case 'card_add_checklist':
        text = `Added checklist "${activity.checklist.name}"`;
        break;
      case 'card_detach_checklist':
        text = `Detached checklist "${activity.checklist.name}"`;
        break;
      case 'card_archive':
        text = 'Moved to archive';
        break;
      case 'card_assign_responsible':
        text = `Made @${activity.user.username} responsible`;
        break;
      case 'card_relieve_responsible':
        text = `Removed responsibility from @${activity.user.username} for card`;
        break;
      case 'card_leave_board':
        text = `Moved from ${this.getTextForTransition(activity)}`;
        break;
      case 'card_join_board':
      case 'card_move':
        text = `Moved to ${this.getTextForTransition(activity)}`;
        break;
      case 'card_remove_block':
        text = `Removed block by ${this.getBlockerTextFromActivity(activity)}`;
        break;
      case 'card_unblock':
        text = `Unblocked by ${this.getBlockerTextFromActivity(activity)}`;
        break;
      case 'card_add_block':
        text = `Added block by ${this.getBlockerTextFromActivity(activity)}`;
        break;
      case 'card_add':
        action = 'created';
        text = `Created in ${this.getTextForTransition(activity)}`;
        break;
      case 'card_remove_member':
        text = `Removed @${activity.user.username} from the card`;
        break;
      case 'card_assign_member':
        text = `Added @${activity.user.username} as a member`;
        break;
      case 'card_change':
        if (activity.changed_field === 'type_id') {
          text = `Changed type to "${this.cardTypes.find(t => t.id === activity.type_id)?.name}"`;
          break;
        } else if (activity.changed_field === 'description') {
          text = `Updated description`;
          break;
        } else if (activity.changed_field === 'properties' && activity.property_type === 'user') {
          const username = this.getPropertyValue(activity.property_value, (v) => v['username']);
          text = username === 'Not set'
             ? `Updated property ${activity.property_name} to "${username}"`
             : `Updated property ${activity.property_name} to @${username}`;
          break;
        } if (activity.changed_field === 'properties') {
          text = `Updated property ${activity.property_name} to "${this.getPropertyValue(activity.property_value)}"`;
          break;
        } else if (activity.changed_field === 'tag_ids' && activity.deleted_tags?.length) {
          text = `Deleted tags: ${activity.deleted_tags.map(t => t.name).join(', ')}`;
          break;
        } else if (activity.changed_field === 'tag_ids' && activity.added_tags?.length) {
          text = `Added tags: ${activity.added_tags.map(t => t.name).join(', ')}`;
          break;
        }
      break;
    }

    return <CardCommentViewModel>{
      action: action,
      author: {
        full_name: activity.author.full_name,
        id: -1
      },
      author_id: activity.author_id,
      created: new Date(activity.created),
      text: text,
    };
  }

  update(comment: CardCommentViewModel, event: TextEditorSaveEvent) {
    if (this.isSavingInProgress) {
      return;
    }

    this.isSavingInProgress = true;
    this.cardEditorService
      .updateComment(this.cardId, comment.comment_id, event.value)
      .pipe(
        finalize(() => this.isSavingInProgress = false),
      )
      .subscribe(updated => {
        event.commit();
        Object.assign(comment, updated);
        comment.author = this.currentUser;
      });
  }

  toggleActivitiesVisible() {
    this.areActivitiesVisible = !this.areActivitiesVisible;
    this.makeEntries();
  }

  toggleCommentsVisible() {
    this.areCommentsVisible = !this.areCommentsVisible;
    this.makeEntries();
  }
}
