import { EMPTY, map, Observable, shareReplay, take } from 'rxjs';
import { User } from '../models/user';
import { Database, getManyWithCache, getSingleWithCache } from './db';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  users$: Observable<User[]> = EMPTY;

  loadUsers() {
    const serverUsers$ = this.httpClient.get<User[]>(`http://server/api/latest/users`);
    this.users$ = serverUsers$
      .pipe(
        shareReplay(),
      );
  }

  constructor(private httpClient: HttpClient) {
    this.loadUsers();
  }

  getUsers(offset: number, limit: number, query?: string): Observable<User[]> {
    return getManyWithCache(this.users$.pipe(take(1)), Database.users)
      .pipe(
        map((users: User[]) => {
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

  getUserById(id: number): Observable<User> {
    const user$ = this.users$
      .pipe(
        take(1),
        map(users => users.find(t => t.id === id))
      );

    return getSingleWithCache(user$, Database.users, id);
  }

  getUserByUid(uid: string): Observable<User> {
    const user$ = this.users$
      .pipe(
        take(1),
        map(users => users.find(t => t.uid === uid))
      );

    return getSingleWithCache(user$, Database.users, { uid });
  }
}