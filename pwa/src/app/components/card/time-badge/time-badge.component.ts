import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe, NgClass } from '@angular/common';
import { TimeagoModule } from 'ngx-timeago';
import { ElapsedPipe } from '../../../pipes/elapsed.pipe';
import { TimespanPipe } from '../../../pipes/timespan.pipe';
import { CardLifetimeBaseComponent } from '../card-lifetime-base.component';
import { nameof } from '../../../functions/name-of';

@Component({
  selector: 'app-time-badge',
  standalone: true,
  imports: [
    NgbTooltip,
    DatePipe,
    TimeagoModule,
    ElapsedPipe,
    TimespanPipe,
    NgClass
  ],
  templateUrl: './time-badge.component.html',
  styleUrl: './time-badge.component.scss'
})
export class TimeBadgeComponent extends CardLifetimeBaseComponent implements OnChanges {
  @Input() public label: string;
  @Input() public since: Date;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardLifetimeBaseComponent>('since')]) {
      this.updateDaysPassed();
    }
  }
}
