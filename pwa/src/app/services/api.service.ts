import { Injectable } from '@angular/core';
import { EMPTY, forkJoin, from, map, Observable, of, shareReplay, switchMap, take, tap, zip } from 'rxjs';
import { CardEx } from '../models/card-ex';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Board } from '../models/board';
import { Space } from '../models/space';
import { User } from '../models/user';
import { Credentials } from '../models/credentials';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../models/custom-property';
import { Lane } from '../models/lane';
import { ColumnEx } from '../models/column-ex';
import { Setting } from '../models/setting';
import { CardComment } from '../models/card-comment';
import { Tag } from '../models/tag';
import { MemberType } from '../models/member-type';
import { Owner } from '../models/owner';
import { Database, getManyWithCache, getSingleWithCache } from './db';
import { CheckListItem } from '../models/check-list-item';
import { CheckList } from '../models/check-list';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient) {
  }

  getFile(url: string): Observable<Blob> {
    return this.httpClient.get(url, {
      responseType: 'blob'
    });
  }
}