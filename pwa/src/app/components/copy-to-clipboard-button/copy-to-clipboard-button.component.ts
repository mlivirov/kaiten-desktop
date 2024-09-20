import { Component, Input, ViewChild } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable, take } from 'rxjs';

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
  @Input() public data: Observable<string>;
  protected justCopied: boolean = false;

  protected copy(): void {
    this.data
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
