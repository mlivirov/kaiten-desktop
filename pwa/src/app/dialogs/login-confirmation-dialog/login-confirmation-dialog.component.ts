import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgIf } from '@angular/common';
import { TimeDotsComponent } from '../../components/card/time-dots/time-dots.component';
import { InlineMemberComponent } from '../../components/inline-member/inline-member.component';
import { User } from '../../models/user';

@Component({
  selector: 'app-login-confirmation-dialog',
  standalone: true,
  imports: [
    NgIf,
    TimeDotsComponent,
    InlineMemberComponent
  ],
  templateUrl: './login-confirmation-dialog.component.html',
  styleUrl: './login-confirmation-dialog.component.scss'
})
export class LoginConfirmationDialogComponent {
  @Input() public user?: User;

  public constructor(public modal: NgbActiveModal) {
  }
}
