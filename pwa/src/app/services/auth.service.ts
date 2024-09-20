import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, forkJoin, from, map, Observable, shareReplay, switchMap, take, tap, zip } from 'rxjs';
import { Setting } from '../models/setting';
import { Database } from './db';
import { Credentials } from '../models/credentials';
import { User } from '../models/user';
import { SettingService } from './setting.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$: Observable<User> = EMPTY;

  public constructor(
    private httpClient: HttpClient,
    private settingsService: SettingService,
  ) {
    this.resetCurrentUser();
  }

  public logout(): Observable<void> {
    return zip(
      this.settingsService.setSetting(Setting.Token, ''),
      from(Database.delete({ disableAutoOpen: false }))
    ).pipe(
      map(() => {}),
      tap(() => {
        this.resetCurrentUser();
      })
    );
  }

  public login(creds: Credentials): Observable<User> {
    return zip([
      this.settingsService.setSetting(Setting.ApiUrl, creds.apiEndpoint),
      this.settingsService.setSetting(Setting.FilesUrl, creds.resourcesEndpoint),
      this.settingsService.setSetting(Setting.Token, creds.apiToken)
    ]).pipe(
      switchMap(() => this.httpClient.get<User>('http://server/api/latest/users/current')),
      tap(() => {
        this.resetCurrentUser();
      })
    );
  }

  public getCurrentUser(): Observable<User> {
    return this.currentUser$.pipe(take(1));
  }

  public getCredentials(): Observable<Credentials | null> {
    return forkJoin({
      ApiUrl: this.settingsService.getSetting(Setting.ApiUrl),
      FilesUrl: this.settingsService.getSetting(Setting.FilesUrl),
      Token: this.settingsService.getSetting(Setting.Token),
    })
      .pipe(
        take(1),
        map(r => {
          return <Credentials>{
            apiEndpoint: r.ApiUrl,
            apiToken: r.Token,
            resourcesEndpoint: r.FilesUrl,
          };
        })
      );
  }

  private resetCurrentUser(): void {
    this.currentUser$ = this.httpClient.get<User>('http://server/api/latest/users/current')
      .pipe(
        shareReplay()
      );
  }
}
