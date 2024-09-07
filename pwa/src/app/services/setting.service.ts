import { Setting } from '../models/setting';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SettingService {
  constructor(private httpClient: HttpClient) { }

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
}