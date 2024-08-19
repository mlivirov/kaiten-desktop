import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap, zip } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { HttpClient } from '@angular/common/http';
import { Board } from '../models/board';
import { Space } from '../models/space';
import { User } from '../models/user';
import { Credentials } from '../models/credentials';
import { CustomProperty, CustomPropertySelectValue } from '../models/custom-property';
import { Lane } from '../models/lane';
import { ColumnEx } from '../models/column-ex';
import { Setting } from '../models/setting';
import { CardComment } from '../models/card-comment';

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
}