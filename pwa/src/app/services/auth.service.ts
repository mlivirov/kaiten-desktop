import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { EMPTY, forkJoin, from, map, Observable, shareReplay, switchMap, take, tap, zip } from 'rxjs';
import { Setting } from '../models/setting';
import { Database } from './db';
import { Credentials } from '../models/credentials';
import { User } from '../models/user';
import { SettingService } from './setting.service';
import { SuppressErrorHttpContextToken } from '../interceptors/error.interceptor';

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
      switchMap(() => this.httpClient.get<User>('http://server/api/latest/users/current', {
        context: new HttpContext().set(SuppressErrorHttpContextToken, true)
      })),
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
      ApiUrl: this.settingsService.getRequiredSetting(Setting.ApiUrl),
      FilesUrl: this.settingsService.getRequiredSetting(Setting.FilesUrl),
      Token: this.settingsService.getRequiredSetting(Setting.Token),
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
    this.currentUser$ = this.httpClient.get<User>('http://server/api/latest/users/current', {
      observe: 'response',
    })
      .pipe(
        tap(response => {
          const originalUiHeader = 'x-original-ui';
          if (response.headers.has(originalUiHeader)) {
            const originalUiUrl = response.headers.get(originalUiHeader);
            this.settingsService.setSetting(Setting.ForwardedApiUrl, originalUiUrl).subscribe();
          } else {
            this.settingsService.setSetting(Setting.ForwardedApiUrl, '').subscribe();
          }
        }),
        map(response => response.body),
        shareReplay()
      );
  }
}
