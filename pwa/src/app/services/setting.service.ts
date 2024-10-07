import { Setting } from '../models/setting';
import { EMPTY, filter, map, Observable, of, Subject, switchMap, tap, throwIfEmpty } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface SettingChange<T> {
  setting: Setting;
  value: T
}

@Injectable({ providedIn: 'root' })
export class SettingService {
  private changes$: Subject<SettingChange<unknown>> = new Subject<SettingChange<unknown>>();

  public constructor(private httpClient: HttpClient) { }

  public subscribeToChanges<T>(setting: Setting): Observable<T> {
    return this.changes$
      .pipe(
        filter(r => r.setting === setting),
        map(r => <T>r.value)
      );
  }

  public setSetting(setting: Setting, value: unknown): Observable<void> {
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

  public getRequiredSetting<T = string>(setting: Setting): Observable<T> {
    return this.httpClient.get(`app://settings#${setting}`, {
      responseType: 'text'
    }).pipe(
      switchMap(t => t?.length ? of(t) : EMPTY),
      throwIfEmpty(),
      map(t => <T>t)
    );
  }

  public getSetting<T = string>(setting: Setting, defaultValue: T): Observable<T> {
    return this.httpClient.get(`app://settings#${setting}`, {
      responseType: 'text'
    }).pipe(
      map(t => t?.length ? <T>t : defaultValue)
    );
  }

  public getBaseUrl(): Observable<string> {
    return this.getSetting(Setting.ForwardedApiUrl, '')
      .pipe(
        switchMap(setting => setting?.length ? of(setting) : this.getSetting<string>(Setting.ApiUrl, ''))
      );
  }
}
