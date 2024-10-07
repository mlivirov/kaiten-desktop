import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BoardStyle } from '../../models/setting';

@Component({
  selector: 'app-board-style-dialog',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './board-style-dialog.component.html',
  styleUrl: './board-style-dialog.component.scss'
})
export class BoardStyleDialogComponent {
  protected readonly BoardStyle = BoardStyle;
  protected boardStyle?: BoardStyle;

  public constructor(public modal: NgbActiveModal) {
  }
  
}
