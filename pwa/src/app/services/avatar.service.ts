import { Injectable } from '@angular/core';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  getUrl(profile: User): string {
    if (!profile) {
      return 'https://api.dicebear.com/9.x/pixel-art/svg';
    }

    if (profile.avatar_uploaded_url) {
      const lastSlash = profile.avatar_uploaded_url.lastIndexOf('/');
      const fileName = profile.avatar_uploaded_url.substring(lastSlash);
      return `http://localhost:8080/files/64x64/${fileName}`;
    }

    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${profile.uid}`;
  }
}