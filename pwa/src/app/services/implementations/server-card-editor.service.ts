import { CardEx } from '../../models/card-ex';
import { map, Observable, switchMap, tap } from 'rxjs';
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
import { ChangesNotificationService } from '../changes-notification.service';

@Injectable({ providedIn: 'root' })
export class ServerCardEditorService implements CardEditorService {
  public constructor(private httpClient: HttpClient, private changesNotificationService: ChangesNotificationService) {
  }

  public createCard(card: Partial<CardEx>): Observable<CardEx> {
    return this.httpClient.post<CardEx>('http://server/api/latest/cards', card)
      .pipe(
        switchMap(createdCard => this.getCard(createdCard.id)),
        tap(createdCard => this.changesNotificationService.notifyCardCreated(createdCard))
      );
  }

  public addRelation(parentCardId: number, childCardId: number): Observable<void> {
    return this.httpClient.post(`http://server/api/latest/cards/${parentCardId}/children`, {
      card_id: childCardId
    }).pipe(
      map(() => {})
    );
  }

  public removeRelation(parentCardId: number, childCardId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${parentCardId}/children/${childCardId}`)
      .pipe(
        map(() => {})
      );
  }

  public updateCard(id: number, properties: Partial<CardEx>): Observable<CardEx> {
    return this.httpClient.patch<CardEx>(`http://server/api/latest/cards/${id}`, properties)
      .pipe(
        switchMap(card => this.getCard(card.id)),
        tap(card => this.changesNotificationService.notifyCardUpdated(card))
      );
  }

  public addMemberToCard(cardId: number, userId: number): Observable<Owner> {
    return this.httpClient.post<Owner>(`http://server/api/latest/cards/${cardId}/members`, {
      user_id: userId,
    });
  }

  public removeMemberFromCard(cardId: number, userId: number): Observable<void> {
    return this.httpClient.delete(`http://server/api/latest/cards/${cardId}/members/${userId}`)
      .pipe(
        map(() => {})
      );
  }

  public updatedMemberType(cardId: number, userId: number, memberType: MemberType): Observable<void> {
    return this.httpClient.patch(`http://server/api/latest/cards/${cardId}/members/${userId}`, {
      type: memberType,
    })
      .pipe(
        map(() => {})
      );
  }

  public getCardComments(cardId: number): Observable<CardComment[]> {
    return this.httpClient.get<CardComment[]>(`http://server/api/latest/cards/${cardId}/comments`);
  }

  public getCardActivity(cardId: number): Observable<CardActivity[]> {
    return this.httpClient.get<CardActivity[]>(`http://server/api/latest/cards/${cardId}/activity?with_timeline_fields=true`);
  }

  public addComment(cardId: number, text: string): Observable<CardComment> {
    return this.httpClient.post<CardComment>(`http://server/api/latest/cards/${cardId}/comments`, {
      text
    });
  }

  public updateComment(cardId: number, commentId: number, text: string): Observable<CardComment> {
    return this.httpClient.patch<CardComment>(`http://server/api/latest/cards/${cardId}/comments/${commentId}`, {
      text
    });
  }

  public getCard(id: number): Observable<CardEx> {
    return this.httpClient.get<CardEx>(`http://server/api/latest/cards/${id}`);
  }

  public updateCardCheckListItem(cardId: number, checklistId: number, checkListItemId: number, checklistItem: Partial<CheckListItem>): Observable<CheckListItem> {
    return this.httpClient
      .patch<CheckListItem>(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}/items/${checkListItemId}`, checklistItem);
  }

  public updateCardCheckList(cardId: number, checklistId: number, checklist: Partial<CheckList>): Observable<CheckList> {
    return this.httpClient
      .patch<CheckList>(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}`, checklist);
  }

  public addCheckListItem(cardId: number, checklistId: number, text: string, position: number|undefined): Observable<CheckListItem> {
    return this.httpClient
      .post<CheckListItem>(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}/items`, <Partial<CheckListItem>>{
        text,
        sort_order: position
      });
  }

  public deleteCheckListItem(cardId: number, checklistId: number, checklistItemId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}/items/${checklistItemId}`)
      .pipe(
        map(() => {})
      );
  }

  public deleteCheckList(cardId: number, checklistId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/checklists/${checklistId}`)
      .pipe(
        map(() => {})
      );
  }

  public addCardCheckList(cardId: number, checklist: Partial<CheckList>): Observable<CheckList> {
    return this.httpClient
      .post<CheckList>(`http://server/api/latest/cards/${cardId}/checklists`, checklist);
  }

  public createTag(cardId: number, name: string): Observable<Tag> {
    return this.httpClient.post<Tag>(`http://server/api/latest/cards/${cardId}/tags`, {
      name
    });
  }

  public removeTag(cardId: number, tagId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/tags/${tagId}`)
      .pipe(
        map(() => {})
      );
  }

  public deleteCard(cardId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}`)
      .pipe(
        map(() => {})
      );
  }

  public addBlocker(cardId: number, blockerCardId?: number, reason?: string): Observable<BlockBlocker> {
    return this.httpClient
      .post<BlockBlocker>(`http://server/api/latest/cards/${cardId}/blockers`, {
      blocker_card_id: blockerCardId,
      reason,
    });
  }

  public editBlocker(cardId: number, blockerId: number, reason?: string): Observable<BlockBlocker> {
    return this.httpClient
      .put<BlockBlocker>(`http://server/api/latest/cards/${cardId}/blockers/${blockerId}`, {
      reason,
    });
  }

  public removeBlocker(cardId: number, blockerId: number): Observable<void> {
    return this.httpClient
      .delete(`http://server/api/latest/cards/${cardId}/blockers/${blockerId}`)
      .pipe(
        map(() => {})
      );
  }
}
