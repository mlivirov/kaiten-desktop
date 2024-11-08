import { Component, Input } from '@angular/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { DialogService } from '../../../services/dialog.service';
import { CardFile } from '../../../models/card-file';

@Component({
  selector: 'app-attachments',
  standalone: true,
  imports: [
    NgxFilesizeModule,
    DatePipe,
    NgIf,
    NgForOf
  ],
  templateUrl: './attachments.component.html',
  styleUrl: './attachments.component.scss'
})
export class AttachmentsComponent {
  @Input() public attachments: CardFile[];

  public constructor(private dialogService: DialogService) {
  }

  protected checkIsImage(attachment: CardFile): boolean {
    return ['png', 'jpg', 'jpeg', 'gif'].some(t => attachment.url.toLowerCase().endsWith(t));
  }

  protected viewAttachment(attachment: CardFile): void {
    this.dialogService.showAttachment(attachment).subscribe();
  }
}
