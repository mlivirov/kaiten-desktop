import { Component } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


export interface ConfirmationDialogButton {
  title: string;
  resultCode: any,
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
  text: string;
  title: string = 'Information';
  buttons: ConfirmationDialogButton[] = [];

  constructor(public modal: NgbActiveModal) {
  }
}
