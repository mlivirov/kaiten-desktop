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
  @Input() public card: CardEx;
  protected baseUrl: string;
  protected isLoading: boolean = false;

  public constructor(private settingService: SettingService) {
    this.settingService
      .getSetting(Setting.ApiUrl)
      .subscribe(url => {
        this.baseUrl = url.substring(0, url.lastIndexOf('/'));
      });
  }
}
