import { Setting } from '../models/setting';
import { map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface SettingChange {
  setting: Setting;
  value: string
}

@Injectable({ providedIn: 'root' })
export class SettingService {
  public changes$ = new Subject<SettingChange>();

  public constructor(private httpClient: HttpClient) { }

  public setSetting(setting: Setting, value: string): Observable<void> {
    return this.httpClient.post(`app://settings#${setting}`, value, {
      responseType: 'text'
    }).pipe(
      tap(() => this.changes$.next({
        setting,
        value
      })),
      map(() => {})
    );
  }

  public getSetting(setting: Setting): Observable<string> {
    return this.httpClient.get(`app://settings#${setting}`, {
      responseType: 'text'
    });
  }

  public getBaseUrl(): Observable<string> {
    return this.getSetting(Setting.ForwardedApiUrl)
      .pipe(
        tap(setting => console.log(setting)),
        switchMap(setting => setting?.length ? of(setting) : this.getSetting(Setting.ApiUrl))
      );
  }
}
