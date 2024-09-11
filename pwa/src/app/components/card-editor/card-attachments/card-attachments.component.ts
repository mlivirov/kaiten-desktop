import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { CardEx } from '../../../models/card-ex';
import { SettingService } from '../../../services/setting.service';
import { Setting } from '../../../models/setting';

@Component({
  selector: 'app-card-attachments',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './card-attachments.component.html',
  styleUrl: './card-attachments.component.scss'
})
export class CardAttachmentsComponent {
  @Input()
  card: CardEx;
  baseUrl: string;
  isLoading: boolean = false;

  constructor(private settingService: SettingService) {
    this.settingService
      .getSetting(Setting.ApiUrl)
      .subscribe(url => {
        this.baseUrl = url.substring(0, url.lastIndexOf('/'));
      });
  }
}
