import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AvatarEntity, Database, getSingleWithCacheWithMap } from './db';

interface CacheItem {
  dataUrl: string;
  createAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  constructor(private apiService: ApiService) {
  }

  private load(profile: User): Observable<Blob> {
    let url: string;

    if (!profile) {
      url = 'https://api.dicebear.com/9.x/pixel-art/svg';
    } else if (!profile.avatar_uploaded_url) {
      url = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${profile.uid}`;
    } else {
      const lastSlash = profile.avatar_uploaded_url.lastIndexOf('/') + 1;
      const fileName = profile.avatar_uploaded_url.substring(lastSlash);
      url = `http://server/files/64x64/${fileName}`;
    }

    return this.apiService.getFile(url);
  }

  getUrl(profile: User): Observable<string> {
    const key: number = profile?.id ?? 0;

    const avatar$ = this.load(profile);
    return getSingleWithCacheWithMap(avatar$, Database.avatars, key, {
      toDto(entity: AvatarEntity) {
        return entity.data;
      },
      toEntity(blob: Blob): AvatarEntity {
        return {
          data: blob,
          user_id: key,
          created_at: new Date()
        }
      }
    }, 1000 * 60 * 6)
      .pipe(
        map(data => {
          return URL.createObjectURL(data);
        })
      );
  }
}