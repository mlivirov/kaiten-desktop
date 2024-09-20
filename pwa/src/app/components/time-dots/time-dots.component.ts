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
  @Input() public since: Date|string|null = null;

  private get sinceDate(): Date {
    if (!this.since) {
      return new Date();
    }

    if (typeof this.since === 'string') {
      return new Date(Date.parse(this.since));
    }

    return this.since;
  }

  protected get daysPassed(): number {
    return  Math.round((Date.now() - this.sinceDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}
