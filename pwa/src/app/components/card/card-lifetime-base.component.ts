import { Injectable } from '@angular/core';

@Injectable()
export abstract class CardLifetimeBaseComponent {
  public abstract since: Date;
  protected daysPassed: number;

  protected getSeverity(): 'base' | 'normal' | 'warning' | 'danger' {
    if (this.daysPassed <= 1) {
      return 'base';
    } else if (this.daysPassed <= 3) {
      return 'normal';
    } else if (this.daysPassed > 3 && this.daysPassed <= 5) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  protected updateDaysPassed(): void {
    if (!this.since) {
      this.daysPassed = 0;
    }

    const sinceTime: number = this.since instanceof Date
      ? this.since.getTime()
      : new Date(Date.parse(this.since)).getTime();

    this.daysPassed = Math.round((Date.now() - sinceTime) / (1000 * 60 * 60 * 24));
  }
  
}