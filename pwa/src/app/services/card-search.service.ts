import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user';
import { Tag } from '../models/tag';
import { Observable } from 'rxjs';
import { CardEx } from '../models/card-ex';


export interface CardFilter {
  text?: string;
  members?: User[];
  owners?: User[];
  tags?: Tag[];
  boardId?: number;
}

@Injectable({ providedIn: 'root' })
export class CardSearchService {

  constructor(private httpClient: HttpClient) {
  }

  searchCards(filter: CardFilter, offset?: number, limit?: number): Observable<CardEx[]> {
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

    if (filter?.boardId) {
      params = params.append('board_id', filter.boardId);
    }

    return this.httpClient.get<CardEx[]>(`http://server/api/latest/cards?${params.toString()}`);
  }
}