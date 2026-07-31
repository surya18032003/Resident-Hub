import { Component, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { NotificationService } from '../../core/services/notification.service';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

/**
 * The frame around every signed-in page: sidebar on the left, topbar on top,
 * and <router-outlet /> in the middle where the current page is drawn.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell implements OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private loadingService = inject(LoadingService);

  /** On phones the sidebar slides in and out; on desktop it is always there. */
  sidebarOpen = false;

  private routerSubscription: Subscription;

  constructor() {
    // Only the admin has a notification screen, so only they need the count.
    if (this.auth.isAdmin()) {
      this.notifications.refresh();
    }

    // Close the mobile sidebar whenever we finish moving to another page.
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setSidebar(false);
      }
    });
  }

  /** Always unsubscribe, or the subscription outlives the component. */
  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  /** true while any request is running: draws the thin bar at the very top. */
  isLoading(): boolean {
    return this.loadingService.isLoading();
  }

  toggleSidebar(): void {
    this.setSidebar(!this.sidebarOpen);
  }

  closeSidebar(): void {
    this.setSidebar(false);
  }

  private setSidebar(open: boolean): void {
    this.sidebarOpen = open;
    // Stops the page behind the sidebar from scrolling on a phone.
    document.body.classList.toggle('is-locked', open);
  }
}
