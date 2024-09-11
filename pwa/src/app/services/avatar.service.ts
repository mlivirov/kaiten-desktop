import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { FileService } from './file.service';
import { AvatarEntity, Database, getSingleWithCacheWithMap } from './db';
import { pixelArt } from '@dicebear/collection';
import { createAvatar, StyleOptions } from '@dicebear/core';

interface CacheItem {
  dataUrl: string;
  createAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  constructor(private apiService: FileService) {
  }

  getUrl(profile: User): Observable<string> {
    const key: number = profile?.id ?? 0;

    if (!profile || !profile.avatar_uploaded_url) {
      const avatar = createAvatar(pixelArt, { seed: profile.id ?? 'None' } as StyleOptions<any>);
      return of(avatar.toDataUri());
    }

    const lastSlash = profile.avatar_uploaded_url.lastIndexOf('/') + 1;
    const fileName = profile.avatar_uploaded_url.substring(lastSlash);
    const url = `http://server/files/64x64/${fileName}`;

    const avatar$ = this.apiService.getFile(url);
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
        switchMap(data => {
          return from(new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            }
            reader.readAsDataURL(data);
          }));
        })
      );
  }
}