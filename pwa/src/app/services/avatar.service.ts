import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { map, Observable, of } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  constructor(private apiService: ApiService) {
  }

  getUrl(profile: User): Observable<string> {
    if (!profile) {
      return of('https://api.dicebear.com/9.x/pixel-art/svg');
    }

    if (!profile.avatar_uploaded_url) {
      return of(`https://api.dicebear.com/9.x/pixel-art/svg?seed=${profile.uid}`);
    }

    const lastSlash = profile.avatar_uploaded_url.lastIndexOf('/') + 1;
    const fileName = profile.avatar_uploaded_url.substring(lastSlash);
    const url = `http://localhost:8080/files/64x64/${fileName}`;

    return this.apiService
      .getFile(url)
      .pipe(
        map(blob => {
          return URL.createObjectURL(blob);
        })
      );
  }
}