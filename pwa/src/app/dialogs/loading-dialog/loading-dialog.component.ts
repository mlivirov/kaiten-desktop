import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-dialog',
  standalone: true,
  imports: [],
  templateUrl: './loading-dialog.component.html',
  styleUrl: './loading-dialog.component.scss'
})
export class LoadingDialogComponent {
  @Input() public text?: string;
}
