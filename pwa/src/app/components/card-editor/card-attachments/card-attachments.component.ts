import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { CardEx } from '../../../models/card-ex';
import { SettingService } from '../../../services/setting.service';
import { Setting } from '../../../models/setting';
import { AttachmentsComponent } from '../attachments/attachments.component';
import { CardFile } from '../../../models/card-file';

@Component({
  selector: 'app-card-attachments',
  standalone: true,
  imports: [
    NgIf,
    AttachmentsComponent
  ],
  templateUrl: './card-attachments.component.html',
  styleUrl: './card-attachments.component.scss'
})
export class CardAttachmentsComponent {
  @Input() public card: CardEx;
  protected baseUrl: string;
  protected isLoading: boolean = false;
  protected attachments: CardFile[];

  public constructor(private settingService: SettingService) {
    this.settingService
      .getRequiredSetting(Setting.ApiUrl)
      .subscribe(url => {
        this.baseUrl = url.substring(0, url.lastIndexOf('/'));
      });
  }
}
