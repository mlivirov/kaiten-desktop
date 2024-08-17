import { Component } from '@angular/core';
import { CardEditorComponent } from '../../components/card-editor/card-editor.component';
import { NgIf } from '@angular/common';
import { CardEx } from '../../models/card-ex';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-card-editor-dialog',
  standalone: true,
  imports: [
    CardEditorComponent,
    NgIf
  ],
  templateUrl: './card-editor-dialog.component.html',
  styleUrl: './card-editor-dialog.component.scss'
})
export class CardEditorDialogComponent {
  card: CardEx;

  constructor(
    public modal: NgbActiveModal
  ) {
  }
}
