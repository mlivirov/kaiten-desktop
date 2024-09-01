import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, zip } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Board } from '../models/board';
import { Space } from '../models/space';
import { User } from '../models/user';
import { Credentials } from '../models/credentials';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../models/custom-property';
import { Lane } from '../models/lane';
import { ColumnEx } from '../models/column-ex';
import { Setting } from '../models/setting';
import { CardComment } from '../models/card-comment';
import { Tag } from '../models/tag';
import { CardFilter } from '../components/card-search-input/card-search-input.component';
import { MemberType } from '../models/member-type';
import { Owner } from '../models/owner';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient) {
  }

  setCredentials(creds: Credentials): Observable<User> {
    return zip([
      this.setSetting(Setting.ApiUrl, creds.apiEndpoint),
      this.setSetting(Setting.FilesUrl, creds.resourcesEndpoint),
      this.setSetting(Setting.Token, creds.apiToken)
    ]).pipe(
      switchMap(() => this.getCurrentUser())
    );
  }

  getCredentials(): Observable<Credentials | null> {
    return forkJoin({
      ApiUrl: this.getSetting(Setting.ApiUrl),
      FilesUrl: this.getSetting(Setting.FilesUrl),
      Token: this.getSetting(Setting.Token),
    })
      .pipe(
        map(r => {
          const isAuthenticated = !(!r.ApiUrl || !r.FilesUrl || !r.Token);

          return isAuthenticated
            ? <Credentials>{
              apiEndpoint: r.ApiUrl,
              apiToken: r.Token,
              resourcesEndpoint: r.FilesUrl,
            }
            : null;
        })
      );
  }

  getFile(url: string): Observable<Blob> {
    return this.httpClient.get(url, {
      responseType: 'blob'
    });
  }

  setSetting(setting: Setting, value: string): Observable<void> {
    return this.httpClient.post(`app://settings#${setting}`, value, {
      responseType: 'text'
    }).pipe(
      map(() => {})
    );
  }

  getSetting(setting: Setting): Observable<string> {
    return this.httpClient.get(`app://settings#${setting}`, {
      responseType: 'text'
    });
  }

  getCards(boardId: number, query?: string): Observable<CardEx[]> {
    return this.httpClient.get<CardEx[]>(`http://server/api/latest/cards?board_id=${boardId}`);
  }

  searchCards(offset: number, limit: number, filter: CardFilter): Observable<CardEx[]> {
    let params = new HttpParams();
    params = params.append('offset', offset);
    params = params.append('limit', limit);

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

    return this.httpClient.get<CardEx[]>(`http://server/api/latest/cards?${params.toString()}`);
  }

  getLanes(boardId: number): Observable<Lane[]> {
    return this.httpClient.get<Lane[]>(`http://server/api/latest/boards/${boardId}/lanes`);
  }

  getCard(id: number): Observable<CardEx> {
    return this.httpClient.get<CardEx>(`http://server/api/latest/cards/${id}`);
  }

  getBoard(boardId: number): Observable<Board> {
    return this.httpClient.get<Board>(`http://server/api/latest/boards/${boardId}`);
  }

  getColumns(boardId: number): Observable<ColumnEx[]> {
    return this.httpClient.get<ColumnEx[]>(`http://server/api/latest/boards/${boardId}/columns`);
  }

  getSpaces(): Observable<Space[]> {
    return this.httpClient.get<Space[]>('http://server/api/latest/spaces');
  }

  getCardComments(cardId: number): Observable<CardComment[]> {
    return this.httpClient.get<CardComment[]>(`http://server/api/latest/cards/${cardId}/comments`);
  }

  addComment(cardId: number, text: string): Observable<CardComment> {
    const form = new FormData();
    form.append('text', text);

    return this.httpClient.post<CardComment>(`http://server/api/latest/cards/${cardId}/comments`, form);
  }

  getCurrentUser(): Observable<User> {
    return this.httpClient.get<User>('http://server/api/latest/users/current');
  }

  getUsers(offset: number, limit: number, query?: string): Observable<User[]> {
    return this.httpClient
      .get<User[]>(`http://server/api/latest/users`)
      .pipe(
        map(users => {
          return this.filterUsers(users, offset, limit, query);
        })
      );
  }

  getCardAllowedUsers(cardId: number, offset: number, limit: number, query?: string): Observable<User[]> {
    return this.httpClient
      .get<User[]>(`http://server/api/latest/cards/${cardId}/allowed-users`)
      .pipe(
        map(users => {
          return this.filterUsers(users, offset, limit, query);
        })
      );
  }

  private filterUsers(users: User[], offset: number, limit: number, query?: string): User[] {
    let filtered = users.filter(u => {
      if (!query || query === '') {
        return true;
      }

      return u.full_name.indexOf(query) !== -1
        || u.username.indexOf(query) != -1;
    });

    if (filtered.length > offset + limit + 1) {
      return filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  getUserByUid(uid: string): Observable<User> {
    return this.httpClient
      .get<User[]>(`http://server/api/latest/users`)
      .pipe(
        map(users => users.find(t => t.uid === uid))
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

  getCustomProperties(): Observable<CustomProperty[]> {
    return this.httpClient.get<CustomProperty[]>(`http://server/api/latest/company/custom-properties`);
  }

  getCustomPropertyValues(id: number): Observable<CustomPropertySelectValue[]> {
    return this.httpClient.get<CustomPropertySelectValue[]>(`http://server/api/latest/company/custom-properties/${id}/select-values`);
  }

  getCustomPropertiesWithValues(): Observable<CustomPropertyAndValues[]> {
    return this.getCustomProperties()
      .pipe(
        switchMap(properties => {
          const results = properties.map(property => {
            if (property.type === 'select') {
              return this.getCustomPropertyValues(property.id)
                .pipe(
                  map(values => ({ property, values } as CustomPropertyAndValues))
                );
            } else {
              return of({ property, values: null } as CustomPropertyAndValues);
            }
          });

          return results.length ? forkJoin<CustomPropertyAndValues[]>(results) : of([]);
        }),
      );
  }


  getTags(offset: number, limit: number, query: string): Observable<Tag[]> {
    let params = new HttpParams();
    params = params.append('offset', offset);
    params = params.append('limit', limit);
    if (query && query !== '') {
      params = params.append('query', query);
    }

    return this.httpClient.get<Tag[]>(`http://server/api/latest/tags?${params.toString()}`);
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
}