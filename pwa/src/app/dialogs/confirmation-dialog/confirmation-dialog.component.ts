import { Component, Input } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export interface ConfirmationDialogButton {
  title: string;
  resultCode: unknown,
  style: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  @Input() public text: string;
  @Input() public title: string = 'Information';
  @Input() public buttons: ConfirmationDialogButton[] = [];

  public constructor(public modal: NgbActiveModal) {
  }
}
