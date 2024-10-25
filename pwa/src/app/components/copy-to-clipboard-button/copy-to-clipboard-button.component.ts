import { Component, Input, ViewChild } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { map, Observable, of, switchMap, take } from 'rxjs';
import { SettingService } from '../../services/setting.service';
import { DefaultSettings, LinkCopyStyle, Setting } from '../../models/setting';
import { NgIf } from '@angular/common';
import { ClipboardService } from 'ngx-clipboard';

export interface CopyToClipboardLinks {
  kaiten: string,
  client: string,
  title: string
}

@Component({
  selector: 'app-copy-to-clipboard-button',
  standalone: true,
  imports: [
    NgbTooltip,
    NgIf
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

  public constructor(
    private settingService: SettingService,
    private clipboardService: ClipboardService
  ) {
  }

  protected copy(clickEvent: MouseEvent): void {
    const data$: Observable<CopyToClipboardLinks> = this.data instanceof Observable ? this.data : of(this.data);
    data$
      .pipe(
        take(1),
        switchMap(data => {
          return this.settingService
            .getSetting(Setting.LinkCopyStyle, DefaultSettings.LinkCopyStyle)
            .pipe(map(linkCopyStyle => {
              const url = linkCopyStyle === LinkCopyStyle.CLIENT ? data.client : data.kaiten;

              if (clickEvent.ctrlKey) {
                return `[${data.title}](${url})`;
              } else {
                return url;
              }
            }));
        })
      )
      .subscribe((data) => {
        this.tooltip.open();
        this.clipboardService.copy(data);
        this.justCopied = true;

        setTimeout(() => {
          this.justCopied = false;
          this.tooltip.close(false);
        }, 1000);
      });
  }
}
