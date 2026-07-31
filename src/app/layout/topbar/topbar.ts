import { Component, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Icon } from '../../shared/components/icon/icon';

/** The bar across the top: menu button, notification bell, account menu. */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink, Icon],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  /** Used to tell whether a click landed outside this component. */
  private elementRef = inject(ElementRef);

  /** The shell listens for this to open the mobile sidebar. */
  @Output() menuToggle = new EventEmitter<void>();

  accountMenuOpen = false;

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  email(): string {
    return this.auth.email();
  }

  initials(): string {
    return this.auth.initials();
  }

  displayName(): string {
    return this.auth.displayName() || 'Account';
  }

  roleLabel(): string {
    return this.auth.isAdmin() ? 'Super Admin' : 'Resident';
  }

  notificationCount(): number {
    return this.notifications.unreadCount();
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  logout(): void {
    this.accountMenuOpen = false;
    this.auth.logout();
  }

  /**
   * @HostListener listens on something outside this component's template —
   * here, every click on the page — so we can close the dropdown when the user
   * clicks somewhere else.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.accountMenuOpen) {
      return;
    }
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.accountMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.accountMenuOpen = false;
  }
}
