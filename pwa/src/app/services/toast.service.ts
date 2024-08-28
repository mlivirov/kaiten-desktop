import { Injectable, TemplateRef } from '@angular/core';

export interface Toast {
  classname?: string;
  delay?: number;
  message?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: Toast[] = [];

  show(toast: Toast) {
    this.toasts.push(toast);
  }

  error(message: string) {
    this.show({ message: message, classname: 'bg-danger text-light' });
  }

  remove(toast: Toast) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  clear() {
    this.toasts.splice(0, this.toasts.length);
  }
}
