import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap, zip } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Board } from '../models/board';
import { Space } from '../models/space';
import { User } from '../models/user';
import { Credentials } from '../models/credentials';
import { CustomProperty, CustomPropertySelectValue } from '../models/custom-property';
import { Lane } from '../models/lane';
import { ColumnEx } from '../models/column-ex';
import { Setting } from '../models/setting';
import { CardComment } from '../models/card-comment';
import { Tag } from '../models/tag';
import { CardFilter } from '../components/card-search-input/card-search-input.component';

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
    return this.httpClient.get<CardEx[]>(`http://localhost:8080/api/latest/cards?board_id=${boardId}`);
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

    return this.httpClient.get<CardEx[]>(`http://localhost:8080/api/latest/cards?${params.toString()}`);
  }

  getLanes(boardId: number): Observable<Lane[]> {
    return this.httpClient.get<Lane[]>(`http://localhost:8080/api/latest/boards/${boardId}/lanes`);
  }

  getCard(id: number): Observable<CardEx> {
    return this.httpClient.get<CardEx>(`http://localhost:8080/api/latest/cards/${id}`);
  }

  getBoard(boardId: number): Observable<Board> {
    return this.httpClient.get<Board>(`http://localhost:8080/api/latest/boards/${boardId}`);
  }

  getColumns(boardId: number): Observable<ColumnEx[]> {
    return this.httpClient.get<ColumnEx[]>(`http://localhost:8080/api/latest/boards/${boardId}/columns`);
  }

  getSpaces(): Observable<Space[]> {
    return this.httpClient.get<Space[]>('http://localhost:8080/api/latest/spaces');
  }

  getCardComments(cardId: number): Observable<CardComment[]> {
    return this.httpClient.get<CardComment[]>(`http://localhost:8080/api/latest/cards/${cardId}/comments`);
  }

  addComment(cardId: number, text: string): Observable<CardComment> {
    const form = new FormData();
    form.append('text', text);

    return this.httpClient.post<CardComment>(`http://localhost:8080/api/latest/cards/${cardId}/comments`, form);
  }

  getCurrentUser(): Observable<User> {
    return this.httpClient.get<User>('http://localhost:8080/api/latest/users/current');
  }

  getUsers(offset: number, limit: number, query?: string): Observable<User[]> {
    return this.httpClient
      .get<User[]>(`http://localhost:8080/api/latest/users`)
      .pipe(
        map(users => {
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
        })
      );
  }

  getUserByUid(uid: string): Observable<User> {
    return this.httpClient
      .get<User[]>(`http://localhost:8080/api/latest/users`)
      .pipe(
        map(users => users.find(t => t.uid === uid))
      );
  }

  updateCard(id: number, properties: Partial<CardEx>): Observable<CardEx> {
    return this.httpClient.patch<CardEx>(`http://localhost:8080/api/latest/cards/${id}`, properties);
  }

  getCustomProperties(): Observable<CustomProperty[]> {
    return this.httpClient.get<CustomProperty[]>(`http://localhost:8080/api/latest/company/custom-properties`);
  }

  getCustomPropertyValues(id: number): Observable<CustomPropertySelectValue[]> {
    return this.httpClient.get<CustomPropertySelectValue[]>(`http://localhost:8080/api/latest/company/custom-properties/${id}/select-values`);
  }

  getTags(offset: number, limit: number, query: string): Observable<Tag[]> {
    let params = new HttpParams();
    params = params.append('offset', offset);
    params = params.append('limit', limit);
    if (query && query !== '') {
      params = params.append('query', query);
    }

    return this.httpClient.get<Tag[]>(`http://localhost:8080/api/latest/tags?${params.toString()}`);
  }
}