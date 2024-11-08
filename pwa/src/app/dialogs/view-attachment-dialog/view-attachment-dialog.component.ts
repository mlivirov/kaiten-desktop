import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { CardFile } from '../../models/card-file';

@Component({
  selector: 'app-view-attachment-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './view-attachment-dialog.component.html',
  styleUrl: './view-attachment-dialog.component.scss'
})
export class ViewAttachmentDialogComponent {
  @Input() public attachment: CardFile;

  public constructor(public modal: NgbActiveModal) {
  }
}
