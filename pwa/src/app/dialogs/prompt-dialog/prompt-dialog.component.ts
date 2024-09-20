import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

export type PromptAction<T> = (value: string) => Observable<T>;

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './prompt-dialog.component.html',
  styleUrl: './prompt-dialog.component.scss'
})
export class PromptDialogComponent<T> {
  @Input() public title: string;
  @Input() public label: string;
  @Input() public action?: PromptAction<T>;
  protected value: string;
  protected isLoading: boolean = false;

  public constructor(
    protected modal: NgbActiveModal
  ) {
  }

  protected continue(): void {
    if (this.action) {
      this.isLoading = true;
      this.action(this.value).subscribe(res => this.modal.close(res));
    } else {
      this.modal.close(this.value);
    }
  }
}
