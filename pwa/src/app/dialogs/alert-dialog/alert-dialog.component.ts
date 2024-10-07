import { Component, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { TimeDotsComponent } from '../../components/card/time-dots/time-dots.component';
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
  public text: string;
  public title: string = 'Information';
  public cancelable = false;

  public constructor(public modal: NgbActiveModal) {
  }

  @HostListener('window:keydown', ['$event'])
  private handleKey(event: KeyboardEvent): void {
    if (event.code === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();

      this.modal.close(true);
    }
  }
}
