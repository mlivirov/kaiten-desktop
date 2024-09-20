import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timespan',
  standalone: true
})
export class TimespanPipe implements PipeTransform {
  private readonly units = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  public transform(value: number): string {
    const { interval, unit } = this.calculateTimeDifference(value / 1000);
    const suffix = interval === 1 ? '' : 's';
    return `${interval} ${unit}${suffix}`;
  }

  private calculateTimeDifference(time: number): { interval: number; unit: string } {
    for (const { label, seconds } of this.units) {
      const interval = Math.floor(time / seconds);
      if (interval >= 1) {
        return {
          interval: interval,
          unit: label
        };
      }
    }
    return {
      interval: 0,
      unit: ''
    };
  }
}
