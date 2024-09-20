import { Injectable } from '@angular/core';

export interface Toast {
  classname?: string;
  delay?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toasts: Toast[] = [];

  public show(toast: Toast): void {
    this.toasts.push(toast);
  }

  public error(message: string): void {
    this.show({ message: message, classname: 'bg-danger text-light' });
  }

  public remove(toast: Toast): void {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  public clear(): void {
    this.toasts.splice(0, this.toasts.length);
  }
}
