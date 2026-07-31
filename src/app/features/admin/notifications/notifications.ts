import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DocumentRecord } from '../../../core/models/domain.models';
import { NotificationService } from '../../../core/services/notification.service';
import { daysUntil } from '../../../core/utils/date.utils';
import { ApiDatePipe } from '../../../shared/pipes/api-date.pipe';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { PageHeader } from '../../../shared/components/page-header/page-header';

/**
 * The notification screen.
 *
 * All the thinking happens in NotificationService; this component only asks it
 * for the three groups and draws them.
 *
 * Opening this page marks the current notifications as read, which empties the
 * red badge in the sidebar and topbar. The lists stay on screen — an expired
 * document is still expired after you have read about it.
 */
@Component({
  selector: 'app-notifications',
  imports: [RouterLink, Icon, PageHeader, EmptyState, ApiDatePipe, DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications {
  private notificationService = inject(NotificationService);

  /** How many days ahead counts as "expiring soon". */
  soonDays = this.notificationService.soonDays;

  /**
   * These read the service every time they are called, rather than copying
   * its value once — otherwise the page would never notice the data arriving.
   */
  isLoading(): boolean {
    return this.notificationService.loading;
  }

  hasLoaded(): boolean {
    return this.notificationService.loaded;
  }

  /** Today's date, shown under the headline. */
  now = new Date();

  constructor() {
    // `true` = mark these notifications as read once they arrive.
    this.notificationService.refresh(true);
  }

  refresh(): void {
    this.notificationService.refresh(true);
  }

  today(): DocumentRecord[] {
    return this.notificationService.expiringToday();
  }

  expired(): DocumentRecord[] {
    return this.notificationService.expired();
  }

  soon(): DocumentRecord[] {
    return this.notificationService.expiringSoon();
  }

  /** How many rows are on the page in total. */
  totalCount(): number {
    return this.notificationService.all().length;
  }

  /** Expired + expiring today: decides the colour of the summary strip. */
  actionCount(): number {
    return this.notificationService.needsAction().length;
  }

  /** The sentence in the summary strip. */
  headline(): string {
    const todayCount = this.today().length;
    const expiredCount = this.expired().length;

    if (todayCount === 0 && expiredCount === 0) {
      return 'Nothing needs attention today';
    }

    const parts: string[] = [];
    if (todayCount > 0) {
      const verb = todayCount === 1 ? 'expires' : 'expire';
      const noun = todayCount === 1 ? 'document' : 'documents';
      parts.push(todayCount + ' ' + noun + ' ' + verb + ' today');
    }
    if (expiredCount > 0) {
      parts.push(expiredCount + ' already expired');
    }
    return parts.join(' · ');
  }

  /** "Expires today" / "Expired 12 days ago" / "Expires in 4 days". */
  timing(doc: DocumentRecord): string {
    const days = daysUntil(doc.expiry_date);
    if (days === null) {
      return 'No expiry date';
    }
    if (days === 0) {
      return 'Expires today';
    }
    if (days < 0) {
      const overdue = Math.abs(days);
      return 'Expired ' + overdue + ' day' + (overdue === 1 ? '' : 's') + ' ago';
    }
    return 'Expires in ' + days + ' day' + (days === 1 ? '' : 's');
  }

  /** The link to the uploaded file, or null when there is none. */
  fileUrl(doc: DocumentRecord): string | null {
    const files = doc.document_file || [];
    return files.length > 0 ? files[0] : null;
  }
}
