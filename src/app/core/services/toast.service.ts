import { Injectable } from '@angular/core';

/** One message in the top-right corner. */
export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

/**
 * The little pop-up messages.
 *
 * Any component can call `toast.success('Saved')`. The list is drawn once, by
 * ToastContainer in app.html, so no page needs its own message area.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** The messages currently on screen. */
  toasts: Toast[] = [];

  private nextId = 1;

  success(title: string, message?: string): void {
    this.show('success', title, message, 4500);
  }

  error(title: string, message?: string): void {
    // Errors stay a little longer, they usually need reading.
    this.show('error', title, message, 7000);
  }

  info(title: string, message?: string): void {
    this.show('info', title, message, 4500);
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  private show(kind: Toast['kind'], title: string, message: string | undefined, ms: number): void {
    const toast: Toast = { id: this.nextId, kind: kind, title: title, message: message };
    this.nextId = this.nextId + 1;

    this.toasts.push(toast);

    // Remove it again after a few seconds.
    setTimeout(() => this.dismiss(toast.id), ms);
  }
}
