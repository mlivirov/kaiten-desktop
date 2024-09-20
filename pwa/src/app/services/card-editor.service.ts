import { CardEx } from '../models/card-ex';
import { Observable } from 'rxjs';
import { Owner } from '../models/owner';
import { CardComment } from '../models/card-comment';
import { CheckListItem } from '../models/check-list-item';
import { CheckList } from '../models/check-list';
import { Tag } from '../models/tag';
import { Injectable, InjectionToken } from '@angular/core';
import { CardActivity } from '../models/card-activity';
import { BlockBlocker } from '../models/block-blocker.model';

export const CARD_EDITOR_SERVICE: InjectionToken<CardEditorService> = new InjectionToken('CardEditorService');

@Injectable()
export abstract class CardEditorService {
  public abstract updateCard(id: number, properties: Partial<CardEx>): Observable<CardEx>;

  public abstract addMemberToCard(cardId: number, userId: number): Observable<Owner>;

  public abstract addRelation(parentCardId: number, childCardId: number): Observable<void>;

  public abstract removeRelation(parentCardId: number, childCardId: number): Observable<void>;

  public abstract removeMemberFromCard(cardId: number, userId: number): Observable<void>;

  public abstract makeMemberResponsible(cardId: number, userId: number): Observable<void>;

  public abstract getCardComments(cardId: number): Observable<CardComment[]>;

  public abstract getCardActivity(cardId: number): Observable<CardActivity[]>;

  public abstract addComment(cardId: number, text: string): Observable<CardComment>;

  public abstract updateComment(cardId: number, commentId: number, text: string): Observable<CardComment>;

  public abstract getCard(id: number): Observable<CardEx>;

  public abstract updateCardCheckListItem(cardId: number, checklistId: number, checkListItemId: number, checklistItem: Partial<CheckListItem>): Observable<CheckListItem>;

  public abstract updateCardCheckList(cardId: number, checklistId: number, checklist: Partial<CheckList>): Observable<CheckList>;

  public abstract addCheckListItem(cardId: number, checklistId: number, text: string, position: number|undefined): Observable<CheckListItem>;

  public abstract deleteCheckListItem(cardId: number, checklistId: number, checklistItemId: number): Observable<void>;

  public abstract deleteCheckList(cardId: number, checklistId: number): Observable<void>;

  public abstract addCardCheckList(cardId: number, checklist: Partial<CheckList>): Observable<CheckList>;

  public abstract createTag(cardId: number, name: string): Observable<Tag>;

  public abstract removeTag(cardId: number, tagId: number): Observable<void>;

  public abstract deleteCard(cardId: number): Observable<void>;

  public abstract addBlocker(cardId: number, blockerCardId?: number, reason?: string): Observable<BlockBlocker>;

  public abstract editBlocker(cardId: number, blockerId: number, reason?: string): Observable<BlockBlocker>;

  public abstract removeBlocker(cardId: number, blockerId: number): Observable<void>;
}
