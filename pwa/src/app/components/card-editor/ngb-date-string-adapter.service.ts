import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class NgbDateStringAdapter extends NgbDateAdapter<string> {
  public fromModel(value: string | null): NgbDateStruct | null {
    if (value) {
      const date = new Date(value);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    }
    return null;
  }

  public toModel(value: NgbDateStruct | null): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value.year, value.month - 1, value.day);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const msLocal = date.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    const isoLocal = iso.slice(0, 19);

    const posOfTime = isoLocal.indexOf('T');
    return isoLocal.substring(0, posOfTime);
  }
}
