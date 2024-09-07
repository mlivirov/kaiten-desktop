import { CardEx } from '../models/card-ex';
import { map, Observable } from 'rxjs';
import { Owner } from '../models/owner';
import { MemberType } from '../models/member-type';
import { CardComment } from '../models/card-comment';
import { CheckListItem } from '../models/check-list-item';
import { CheckList } from '../models/check-list';
import { Tag } from '../models/tag';
import { Injectable, InjectionToken } from '@angular/core';

export const CARD_EDITOR_SERVICE: InjectionToken<CardEditorService> = new InjectionToken('CardEditorService');

@Injectable()
export abstract class CardEditorService {
  abstract updateCard(id: number, properties: Partial<CardEx>): Observable<CardEx>;

  abstract addMemberToCard(cardId: number, userId: number): Observable<Owner>;

  abstract removeMemberFromCard(cardId: number, userId: number): Observable<void>;

  abstract makeMemberResponsible(cardId: number, userId: number): Observable<void>;

  abstract getCardComments(cardId: number): Observable<CardComment[]>;

  abstract addComment(cardId: number, text: string): Observable<CardComment>;

  abstract updateComment(cardId: number, commentId: number, text: string): Observable<CardComment>;

  abstract getCard(id: number): Observable<CardEx>;

  abstract updateCardCheckListItem(cardId: number, checklistId: number, checkListItemId: number, checklistItem: Partial<CheckListItem>): Observable<CheckListItem>;

  abstract updateCardCheckList(cardId: number, checklistId: number, checklist: Partial<CheckList>): Observable<CheckList>;

  abstract addCheckListItem(cardId: number, checklistId: number, text: string, position: number|undefined): Observable<CheckListItem>;

  abstract deleteCheckListItem(cardId: number, checklistId: number, checklistItemId: number): Observable<void>;

  abstract deleteCheckList(cardId: number, checklistId: number): Observable<void>;

  abstract addCardCheckList(cardId: number, checklist: Partial<CheckList>): Observable<CheckList>;

  abstract createTag(cardId: number, name: string): Observable<Tag>;

  abstract removeTag(cardId: number, tagId: number): Observable<void>;

  abstract deleteCard(cardId: number): Observable<void>;
}