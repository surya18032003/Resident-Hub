import { Component, inject } from '@angular/core';

import { Toast, ToastService } from '../../../core/services/toast.service';
import { Icon } from '../icon/icon';

/**
 * Draws the pop-up messages. It appears once, in app.html, and simply shows
 * whatever ToastService is currently holding.
 */
@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  private toastService = inject(ToastService);

  /** The template loops over this. */
  toasts(): Toast[] {
    return this.toastService.toasts;
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
