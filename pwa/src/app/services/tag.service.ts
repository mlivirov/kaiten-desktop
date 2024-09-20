import { Observable } from 'rxjs';
import { Tag } from '../models/tag';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({providedIn: 'root'})
export class TagService {

  public constructor(private httpClient: HttpClient) {
  }

  public getTags(offset: number, limit: number, query: string): Observable<Tag[]> {
    let params = new HttpParams();
    params = params.append('offset', offset);
    params = params.append('limit', limit);
    if (query && query !== '') {
      params = params.append('query', query);
    }

    return this.httpClient.get<Tag[]>(`http://server/api/latest/tags?${params.toString()}`);
  }
}
