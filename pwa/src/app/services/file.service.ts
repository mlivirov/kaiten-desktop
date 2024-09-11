import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private httpClient: HttpClient) {
  }

  getFile(url: string): Observable<Blob> {
    return this.httpClient.get(url, {
      responseType: 'blob'
    });
  }
}