import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
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
  cancelable = false;

  constructor(public modal: NgbActiveModal) {
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.code === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.modal.close(true);
    }
  }
}
