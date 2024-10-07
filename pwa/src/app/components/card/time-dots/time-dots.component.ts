import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TimeagoModule } from 'ngx-timeago';
import { CardLifetimeBaseComponent } from '../card-lifetime-base.component';
import { nameof } from '../../../functions/name-of';

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
export class TimeDotsComponent extends CardLifetimeBaseComponent implements OnChanges {
  @Input() public since: Date;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardLifetimeBaseComponent>('since')]) {
      this.updateDaysPassed();
    }
  }
}
