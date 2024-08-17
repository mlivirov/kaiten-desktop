import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { HttpClient } from '@angular/common/http';
import { Board } from '../models/board';
import { Space } from '../models/space';
import { User } from '../models/user';
import { Credentials } from '../models/credentials';
import { CustomProperty, CustomPropertySelectValue } from '../models/custom-property';
import { Lane } from '../models/lane';
import { ColumnEx } from '../models/column-ex';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient) {
  }

  setCredentials(creds: Credentials): Observable<User> {
    return this.getCurrentUser();
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