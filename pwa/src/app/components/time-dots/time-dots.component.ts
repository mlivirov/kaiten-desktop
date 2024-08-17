import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TimeagoModule } from 'ngx-timeago';

@Component({
  selector: 'app-time-dots',
  standalone: true,
  imports: [
    NgClass,
    NgbTooltip,
    TimeagoModule
  ],
  templateUrl: './time-dots.component.html',
  styleUrl: './time-dots.component.scss'
})
export class TimeDotsComponent {
  @Input()
  since: Date|string|null = null;

  get sinceDate(): Date {
    if (!this.since) {
      return new Date()
    }

    if (typeof this.since === 'string') {
      return new Date(Date.parse(this.since));
    }

    return this.since;
  }


  get daysPassed() {
    const days = Math.round((Date.now() - this.sinceDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }

  get timePassed() {
    let delta = Math.abs(Date.now() - this.sinceDate.getTime()) / 1000;
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    const seconds = Math.floor(delta % 60);
    return { hours, minutes, seconds };
  }
}
