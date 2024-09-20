import { Component, Input, ViewChild } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, take } from 'rxjs';

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
  @ViewChild(NgbTooltip) protected tooltip: NgbTooltip;
  @Input() public btnClass = '';
  @Input() public data: Observable<string>|string;
  @Input() public iconClass = 'pi-copy';
  protected justCopied: boolean = false;

  protected copy(): void {
    const data$ = this.data instanceof Observable ? this.data : of(this.data);
    data$
      .pipe(
        take(1)
      )
      .subscribe((data) => {
        navigator.clipboard.writeText(data);
        this.justCopied = true;

        setTimeout(() => this.justCopied = false, 1000);
      });
  }
}
