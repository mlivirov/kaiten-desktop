import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, from, interval, map, Observable, tap, timeout } from 'rxjs';
import { SettingService } from './setting.service';
import { Setting } from '../models/setting';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeManagerService {
  public currentTheme$: BehaviorSubject<Theme> = new BehaviorSubject('light');
  public autoThemeTimeout?: number;

  constructor(private settingsService: SettingService) {
    this.settingsService
      .getSetting(Setting.Theme)
      .pipe(
        filter(r => !!r)
      )
      .subscribe(setting => this.currentTheme$.next(setting as Theme));

    this.currentTheme$
      .subscribe(theme => {
        if (theme === 'light' || theme === 'dark') {
          this.setPageTheme(theme);
          clearTimeout(this.autoThemeTimeout);
        } else if (theme === 'auto') {
          this.autoSetTheme();
          this.autoThemeTimeout ??= setTimeout(() => this.currentTheme$.next(this.currentTheme$.value), 1000 * 60 * 60)
        }
      });
  }

  setTheme(theme: Theme): Observable<void> {
    return this.settingsService
      .setSetting(Setting.Theme, theme)
      .pipe(
        tap(() => this.currentTheme$.next(theme)),
        map(() => {})
      );
  }

  private autoSetTheme(): void {
    const now = new Date();

    if (now.getHours() > 18 || now.getHours() <= 8) {
      this.setPageTheme('dark');
    } else {
      this.setPageTheme('light');
    }
  }

  private setPageTheme(theme: Theme): void {
    const html = (document.querySelector('html') as HTMLElement);
    html.setAttribute('data-bs-theme', theme);
  }
}