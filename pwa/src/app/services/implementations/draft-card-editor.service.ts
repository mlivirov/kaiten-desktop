import { CardEx } from '../../models/card-ex';
import { EMPTY, forkJoin, from, last, map, mergeMap, Observable, of, switchMap } from 'rxjs';
import { Owner } from '../../models/owner';
import { MemberType } from '../../models/member-type';
import { CheckListItem } from '../../models/check-list-item';
import { CheckList } from '../../models/check-list';
import { Tag } from '../../models/tag';
import { CardComment } from '../../models/card-comment';
import { CardEditorService } from '../card-editor.service';
import { Injectable } from '@angular/core';
import { CardEntity, Database } from '../db';
import { UserService } from '../user.service';
import { UnionIfNotExistsFunction } from '../../functions/union-if-not-exists.function';
import { CardState } from '../../models/card-state';
import { AuthService } from '../auth.service';
import { BoardService } from '../board.service';
import { FlattenColumnsFunction } from '../../functions/flatten-columns.function';
import { Space } from '../../models/space';
import { Card } from '../../models/card';
import { CardActivity } from '../../models/card-activity';
import { BlockBlocker } from '../../models/block-blocker.model';

@Injectable({ providedIn: 'root' })
export class DraftCardEditorService implements CardEditorService {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private boardService: BoardService,
  ) {
  }

  getLastDraft(): Observable<CardEx> {
    return from(Database.cardDrafts.toArray()).pipe(switchMap(drafts => drafts?.length ? of(drafts[drafts.length - 1]) : EMPTY));
  }

  createNewDraft(boardId: number, laneId?: number, typeId?: number, title: string|null = null): Observable<CardEx> {
    return forkJoin({
      owner: this.authService.getCurrentUser(),
      board: this.boardService.getBoard(boardId),
      lane: this.boardService.getLanes(boardId).pipe(map(lanes => {
        if (laneId) {
          return lanes.find(t => t.id === laneId);
        }

        const defaultLane = lanes.find(t => !t.title?.length);
        if (defaultLane) {
          return defaultLane;
        }

        return lanes.sort((a, b) => a.sort_order - b.sort_order)[0];
      })),
      column: this.boardService.getColumns(boardId).pipe(map(columns => {
        const flattenColumns = FlattenColumnsFunction(columns).sort((a, b) => a.sort_order - b.sort_order);
        return flattenColumns[0];
      })),
      type: this.boardService.getCardTypes().pipe(
        map(types => types.find(t => t.id === typeId || !typeId)),
      )
    })
      .pipe(
        switchMap(({owner, board, lane, column, type}) => {
          const base = { created_at: new Date() } as unknown as CardEx;
          const card = <CardEntity>{
            ...base,
            state: CardState.Draft,
            owner_id: owner.id,
            owner: owner,
            board_id: board.id,
            board: board,
            lane_id: lane.id,
            lane: lane,
            column_id: column.id,
            column: column,
            type_id: type.id,
            type: type,
            created: new Date(),
            tags: [],
            members: [],
            checklists: [],
            title: title
          };

          return from(Database.cardDrafts.add(card)).pipe(map(id => {
            card.id = id;
            return card;
          }));
        }),
      );
  }

  updateCard(id: number, properties: Partial<CardEx>): Observable<CardEx> {
    const card$ = from(Database.cardDrafts.get(id));
    return card$.pipe(
        switchMap((card: CardEx) => {
          Object.assign(card, properties);
          return from(Database.cardDrafts.put(<CardEntity>card)).pipe(map(() => card));
        })
      );
  }

  addMemberToCard(cardId: number, userId: number): Observable<Owner> {
    return forkJoin({
      user: this.userService.getUserById(userId),
      card: from(Database.cardDrafts.get(cardId))
    })
    .pipe(
      switchMap(({user, card}) => {
        const member = <Owner>{
          ...user,
          card_id: cardId,
          user_id: userId,
          type: MemberType.Member,
        };

        card.members = UnionIfNotExistsFunction(card.members, member, 'id');
        return forkJoin({
            card: from(Database.cardDrafts.put(card)),
            member: of(member)
        });
      }),
      map(({card, member}) => member)
    );
  }

  removeMemberFromCard(cardId: number, userId: number): Observable<void> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const indexOfMember = card.members?.findIndex(t => t.id === userId);
          card.members?.splice(indexOfMember, 1);

          return from(Database.cardDrafts.put(card));
        }),
        map(() => {})
      )
  }

  makeMemberResponsible(cardId: number, userId: number): Observable<void> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          card.members?.forEach(m => m.type = m.id === userId ? MemberType.Responsible : MemberType.Member);
          return from(Database.cardDrafts.put(card));
        }),
        map(() => {})
      )
  }

  removeRelation(parentCardId: number, childCardId: number): Observable<void> {
    throw new Error('Not supported');
  }

  addRelation(parentCardId: number, childCardId: number): Observable<void> {
    throw new Error('not supported');
  }

  getCardActivity(cardId: number): Observable<CardActivity[]> {
    throw new Error('not supported');
  }

  getCardComments(cardId: number): Observable<CardComment[]> {
    throw new Error('not supported');
  }

  addComment(cardId: number, text: string): Observable<CardComment> {
    throw new Error('not supported');
  }

  updateComment(cardId: number, commentId: number, text: string): Observable<CardComment> {
    throw new Error('not supported');
  }

  getCard(id: number): Observable<CardEx> {
    return from(Database.cardDrafts.get(id));
  }

  updateCardCheckListItem(cardId: number, checklistId: number, checkListItemId: number, checklistItem: Partial<CheckListItem>): Observable<CheckListItem> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const checklist = card.checklists.find(t => t.id === checklistId);
          const item = checklist.items.find(t => t.id === checkListItemId);
          Object.assign(item, checklistItem);

          return from(Database.cardDrafts.put(card)).pipe(map(() => item));
        }),
      )
  }

  updateCardCheckList(cardId: number, checklistId: number, data: Partial<CheckList>): Observable<CheckList> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const checklist = card.checklists.find(t => t.id === checklistId);
          Object.assign(checklist, data);

          return from(Database.cardDrafts.put(card)).pipe(map(() => checklist));
        }),
      )
  }

  addCheckListItem(cardId: number, checklistId: number, text: string, position: number|undefined): Observable<CheckListItem> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const checklist = card.checklists.find(t => t.id === checklistId);
          const item = <CheckListItem>{
            text: text,
            sort_order: position,
            checked: false,
            id: Math.random() * Number.MAX_VALUE
          };

          checklist.items = UnionIfNotExistsFunction(checklist.items, item, 'id');
          return from(Database.cardDrafts.put(card)).pipe(map(() => item));
        }),
      )
  }

  deleteCheckListItem(cardId: number, checklistId: number, checklistItemId: number): Observable<void> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const checklist = card.checklists.find(t => t.id === checklistId);
          const indexToDelete = checklist.items?.findIndex(t => t.id === checklistItemId);
          checklist.items.splice(indexToDelete, 1);

          return from(Database.cardDrafts.put(card));
        }),
        map(() => {})
      );
  }

  deleteCheckList(cardId: number, checklistId: number): Observable<void> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const indexToDelete = card.checklists.findIndex(t => t.id === checklistId);
          card.checklists.splice(indexToDelete, 1);

          return from(Database.cardDrafts.put(card));
        }),
        map(() => {})
      );
  }

  addCardCheckList(cardId: number, data: Partial<CheckList>): Observable<CheckList> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const checklist = <CheckList>{
            sort_order: 1,
            ...data,
            id: Math.random() * Number.MAX_VALUE,
            items: []
          };

          card.checklists = UnionIfNotExistsFunction(card.checklists, checklist, 'id');

          return from(Database.cardDrafts.put(card)).pipe(map(() => checklist));
        })
      );
  }

  createTag(cardId: number, name: string): Observable<Tag> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const tag = <Tag>{
            id: Math.random() * Number.MAX_VALUE,
            name: name,
          };

          card.tags = UnionIfNotExistsFunction(card.tags, tag, 'id');

          return from(Database.cardDrafts.put(card)).pipe(map(() => tag));
        })
      );
  }

  removeTag(cardId: number, tagId: number): Observable<void> {
    return from(Database.cardDrafts.get(cardId))
      .pipe(
        switchMap(card => {
          const indexToDelete = card.tags.findIndex(t => t.id === tagId);
          card.tags.splice(indexToDelete, 1);

          return from(Database.cardDrafts.put(card)).pipe(map(() => {}));
        })
      );
  }

  deleteCard(cardId: number): Observable<void> {
    return from(Database.cardDrafts.delete(cardId));
  }

  addBlocker(cardId: number, blockingCardId?: number, reason?: string): Observable<BlockBlocker> {
    throw new Error('not supported');
  }

  editBlocker(cardId: number, blockerId: number, reason?: string): Observable<BlockBlocker> {
    throw new Error('not supported');
  }

  removeBlocker(cardId: number, blockerId: number): Observable<void> {
    throw new Error('not supported');
  }
}