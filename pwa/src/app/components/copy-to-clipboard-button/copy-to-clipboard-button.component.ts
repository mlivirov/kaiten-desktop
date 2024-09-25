import { Component, Input, ViewChild } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { map, Observable, of, switchMap, take } from 'rxjs';
import { SettingService } from '../../services/setting.service';
import { LinkCopyStyle, Setting } from '../../models/setting';

export interface CopyToClipboardLinks {
  kaiten: string,
  client: string,
}

@Component({
  selector: 'app-copy-to-clipboard-button',
  standalone: true,
  imports: [
    NgbTooltip
  ],
  templateUrl: './copy-to-clipboard-button.component.html',
  styleUrl: './copy-to-clipboard-button.component.scss'
})
export class CopyToClipboardButtonComponent {
  @Input() public btnClass = '';
  @Input() public data: Observable<CopyToClipboardLinks>|CopyToClipboardLinks;
  @Input() public iconClass = 'pi-copy';
  @ViewChild(NgbTooltip) protected tooltip: NgbTooltip;
  protected justCopied: boolean = false;

  public constructor(private settingService: SettingService) {
  }

  protected copy(): void {
    const data$ = this.data instanceof Observable ? this.data : of(this.data);
    data$
      .pipe(
        take(1),
        switchMap(data => {
          return this.settingService.getSetting(Setting.LinkCopyStyle).pipe(map(linkCopyStyle => {
            if (linkCopyStyle === LinkCopyStyle.CLIENT) {
              return data.client;
            } else {
              return data.kaiten;
            }
          }));
        })
      )
      .subscribe((data) => {
        navigator.clipboard.writeText(data);
        this.justCopied = true;

        setTimeout(() => this.justCopied = false, 1000);
      });
  }
}
