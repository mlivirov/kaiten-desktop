import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { TimeDotsComponent } from '../../components/time-dots/time-dots.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    NgIf,
    TimeDotsComponent
  ],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.scss'
})
export class AlertDialogComponent {
  text: string;
  title: string = 'Information';

  constructor(public modal: NgbActiveModal) {
  }
}
