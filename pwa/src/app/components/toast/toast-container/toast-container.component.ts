import { Component } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { NgForOf, NgTemplateOutlet } from '@angular/common';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    NgForOf,
    NgbToast,
    NgTemplateOutlet
  ],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
  public constructor(public toastService: ToastService) {
  }
}
