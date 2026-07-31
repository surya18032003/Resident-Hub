import { Component, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { NavItem, navigationFor } from '../../core/config/navigation';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Icon } from '../../shared/components/icon/icon';

/**
 * The dark navigation panel.
 *
 * The list of links is not written in the template — it comes from
 * core/config/navigation.ts and depends on the role, which is what makes the
 * sidebar "dynamic". To add a menu entry, edit that file only.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  /** The page we are on, used to highlight the matching link. */
  private currentPath = '';

  /** Groups the user opened or closed by hand, e.g. { Residents: true }. */
  private openGroups: Record<string, boolean> = {};

  private routerSubscription: Subscription;

  constructor() {
    this.currentPath = this.pathOf(this.router.url);

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentPath = this.pathOf(event.urlAfterRedirects);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  /** The links for whoever is signed in. */
  items(): NavItem[] {
    return navigationFor(this.auth.role());
  }

  roleLabel(): string {
    return this.auth.isAdmin() ? 'Super Admin' : 'Resident';
  }

  /** The red number next to "Notifications". */
  notificationCount(): number {
    return this.notifications.unreadCount();
  }

  /** True for the link of the page we are currently looking at. */
  isActive(route: string | undefined): boolean {
    return route !== undefined && this.currentPath === route;
  }

  /** True when one of a group's children is the current page. */
  isGroupActive(item: NavItem): boolean {
    const children = item.children || [];
    return children.some((child) => this.isActive(child.route));
  }

  /**
   * A group is open if the user opened it, or — when they have not touched it
   * — because we are on one of its pages.
   */
  isOpen(item: NavItem): boolean {
    const chosen = this.openGroups[item.label];
    if (chosen === undefined) {
      return this.isGroupActive(item);
    }
    return chosen;
  }

  toggleGroup(item: NavItem): void {
    this.openGroups[item.label] = !this.isOpen(item);
  }

  /** "/admin/residents?page=2" -> "/admin/residents" */
  private pathOf(url: string): string {
    return url.split('?')[0].split('#')[0];
  }
}
