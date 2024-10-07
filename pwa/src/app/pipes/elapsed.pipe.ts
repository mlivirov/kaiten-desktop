import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'elapsed',
  standalone: true
})
export class ElapsedPipe implements PipeTransform {

  public transform(value: Date|string): number {
    if (!(value instanceof Date)) {
      return new Date(Date.parse(value)).elapsed();
    } else {
      return value.elapsed();
    }
  }
}
