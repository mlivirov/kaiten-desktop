import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user';
import { Tag } from '../models/tag';
import { Observable } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { BoardBase } from '../models/board';
import { CardType } from '../models/card-type';

export interface CardFilter {
  text?: string;
  members?: User[];
  owners?: User[];
  tags?: Tag[];
  board?: BoardBase;
  type?: CardType;
  includeArchived?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CardSearchService {

  public constructor(private httpClient: HttpClient) {
  }

  public searchCards(filter: CardFilter, offset?: number, limit?: number): Observable<CardEx[]> {
    let params = new HttpParams();

    if (offset) {
      params = params.append('offset', offset);
    }

    if (limit) {
      params = params.append('limit', limit);
    }

    if (filter?.text) {
      params = params.append('query', filter.text);
    }

    if (filter?.members?.length) {
      const ids = filter.members.map(t => t.id).join(',');
      params = params.append('member_ids', ids);
    }

    if (filter?.owners?.length) {
      const ids = filter.owners.map(t => t.id).join(',');
      params = params.append('owner_ids', ids);
    }

    if (filter?.tags?.length) {
      const ids = filter.tags.map(t => t.id).join(',');
      params = params.append('tag_ids', ids);
    }

    if (filter?.board) {
      params = params.append('board_id', filter.board.id);
    }

    if (filter?.type) {
      params = params.append('type_id', filter.type.id);
    }

    if (filter?.includeArchived) {
      params = params.append('archived', true);
    } else {
      params = params.append('archived', false);
    }

    return this.httpClient.get<CardEx[]>(`http://server/api/latest/cards?${params.toString()}`);
  }
}
