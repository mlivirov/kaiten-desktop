import { CardEx } from '../../models/card-ex';
import { map, Observable, of } from 'rxjs';
import { Owner } from '../../models/owner';
import { MemberType } from '../../models/member-type';
import { CheckListItem } from '../../models/check-list-item';
import { CheckList } from '../../models/check-list';
import { Tag } from '../../models/tag';
import { CardComment } from '../../models/card-comment';
import { HttpClient } from '@angular/common/http';
import { CardEditorService } from '../card-editor.service';
import { Injectable } from '@angular/core';
import { CardActivity } from '../../models/card-activity';
import { BlockBlocker } from '../../models/block-blocker.model';

@Injectable({ providedIn: 'root' })
export class ServerCardEditorService implements CardEditorService {
  constructor(private httpClient: HttpClient) {
  }

  createCard(card: Partial<CardEx>) {
    return this.httpClient.post<CardEx>(`http://server/api/latest/cards`, card);
  }

  addRelation(parentCardId: number, childCardId: number): Observable<void> {
    return this.httpClient.post(`http://server/api/latest/cards/${parentCardId}/children`, {
      card_id: childCardId
    }).pipe(
      map(() => {})
    );
  }

  removeRelation(parentCardId: number, childCardId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${parentCardId}/children/${childCardId}`)
      .pipe(
        map(() => {})
      );
  }

  updateCard(id: number, properties: Partial<CardEx>): Observable<CardEx> {
    return this.httpClient.patch<CardEx>(`http://server/api/latest/cards/${id}`, properties);
  }

  addMemberToCard(cardId: number, userId: number): Observable<Owner> {
    return this.httpClient.post<Owner>(`http://server/api/latest/cards/${cardId}/members`, {
      user_id: userId,
    });
  }

  removeMemberFromCard(cardId: number, userId: number): Observable<void> {
    return this.httpClient.delete(`http://server/api/latest/cards/${cardId}/members/${userId}`)
      .pipe(
        map(res => {})
      );
  }

  makeMemberResponsible(cardId: number, userId: number): Observable<void> {
    return this.httpClient.patch(`http://server/api/latest/cards/${cardId}/members/${userId}`, {
        type: MemberType.Responsible,
      })
      .pipe(
        map(res => {})
      );
  }

  getCardComments(cardId: number): Observable<CardComment[]> {
    return this.httpClient.get<CardComment[]>(`http://server/api/latest/cards/${cardId}/comments`);
  }

  getCardActivity(cardId: number): Observable<CardActivity[]> {
    return this.httpClient.get<CardActivity[]>(`http://server/api/latest/cards/${cardId}/activity?with_timeline_fields=true`);
  }

  addComment(cardId: number, text: string): Observable<CardComment> {
    return this.httpClient.post<CardComment>(`http://server/api/latest/cards/${cardId}/comments`, {
      text
    });
  }

  updateComment(cardId: number, commentId: number, text: string): Observable<CardComment> {
    return this.httpClient.patch<CardComment>(`http://server/api/latest/cards/${cardId}/comments/${commentId}`, {
      text
    });
  }

  getCard(id: number): Observable<CardEx> {
    return this.httpClient.get<CardEx>(`http://server/api/latest/cards/${id}`);
  }

  updateCardCheckListItem(cardId: number, checklistId: number, checkListItemId: number, checklistItem: Partial<CheckListItem>): Observable<CheckListItem> {
    return this.httpClient
      .patch<CheckListItem>(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}/items/${checkListItemId}`, checklistItem);
  }

  updateCardCheckList(cardId: number, checklistId: number, checklist: Partial<CheckList>): Observable<CheckList> {
    return this.httpClient
      .patch<CheckList>(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}`, checklist);
  }

  addCheckListItem(cardId: number, checklistId: number, text: string, position: number|undefined): Observable<CheckListItem> {
    return this.httpClient
      .post<CheckListItem>(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}/items`, <Partial<CheckListItem>>{
        text,
        sort_order: position
      });
  }

  deleteCheckListItem(cardId: number, checklistId: number, checklistItemId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}/items/${checklistItemId}`)
      .pipe(
        map(() => {})
      );
  }

  deleteCheckList(cardId: number, checklistId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}`)
      .pipe(
        map(() => {})
      );
  }

  addCardCheckList(cardId: number, checklist: Partial<CheckList>): Observable<CheckList> {
    return this.httpClient
      .post<CheckList>(`http://server/api/latest/cards/${cardId}/checklists`, checklist);
  }


  createTag(cardId: number, name: string): Observable<Tag> {
    return this.httpClient.post<Tag>(`http://server/api/latest/cards/${cardId}/tags`, {
      name
    });
  }

  removeTag(cardId: number, tagId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/tags/${tagId}`)
      .pipe(
        map(() => {})
      );
  }

  deleteCard(cardId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}`)
      .pipe(
        map(() => {})
      );
  }

  addBlocker(cardId: number, blockerCardId?: number, reason?: string): Observable<BlockBlocker> {
    return this.httpClient
      .post<BlockBlocker>(`http://server/api/latest/cards/${cardId}/blockers`, {
        blocker_card_id: blockerCardId,
        reason,
      });
  }

  editBlocker(cardId: number, blockerId: number, reason?: string): Observable<BlockBlocker> {
    return this.httpClient
      .put<BlockBlocker>(`http://server/api/latest/cards/${cardId}/blockers/${blockerId}`, {
        reason,
      });
  }

  removeBlocker(cardId: number, blockerId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/blockers/${blockerId}`)
      .pipe(
        map(() => {})
      );
  }
}