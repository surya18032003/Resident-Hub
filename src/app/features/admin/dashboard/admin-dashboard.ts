import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Announcement, DocumentRecord, Resident } from '../../../core/models/domain.models';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService } from '../../../core/services/document.service';
import { ResidentService } from '../../../core/services/resident.service';
import { daysUntil } from '../../../core/utils/date.utils';
import { ApiDatePipe, TimeAgoPipe } from '../../../shared/pipes/api-date.pipe';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';

/**
 * The Super Admin home page.
 *
 * It needs three different lists, so it fires three requests and lets each one
 * fill in its own part of the page as it arrives. One failing request only
 * blanks its own tile instead of the whole dashboard.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, Icon, PageHeader, StatCard, EmptyState, ApiDatePipe, TimeAgoPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  private residentService = inject(ResidentService);
  private announcementService = inject(AnnouncementService);
  private documentService = inject(DocumentService);
  private auth = inject(AuthService);

  residents: Resident[] = [];
  announcements: Announcement[] = [];
  documents: DocumentRecord[] = [];

  loading = true;
  loadError: string | null = null;

  constructor() {
    this.load();
  }

  name(): string {
    return this.auth.displayName() || 'there';
  }

  load(): void {
    this.loading = true;
    this.loadError = null;

    // Three separate requests, each with its own handlers.
    this.residentService.list().subscribe({
      next: (residents) => {
        this.residents = residents;
      },
      error: (error: Error) => this.reportProblem(error),
    });

    this.announcementService.list().subscribe({
      next: (announcements) => {
        this.announcements = announcements;
      },
      error: (error: Error) => this.reportProblem(error),
    });

    this.documentService.list().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: (error: Error) => {
        this.reportProblem(error);
        this.loading = false;
      },
    });
  }

  /** Documents whose expiry date is today. */
  expiringToday(): DocumentRecord[] {
    return this.documents.filter((doc) => daysUntil(doc.expiry_date) === 0);
  }

  /** Documents whose expiry date has already passed. */
  expiredDocs(): DocumentRecord[] {
    return this.documents.filter((doc) => {
      const days = daysUntil(doc.expiry_date);
      return days !== null && days < 0;
    });
  }

  /** Due in the next 30 days — used for the small grey hint. */
  expiringSoonCount(): number {
    return this.documents.filter((doc) => {
      const days = daysUntil(doc.expiry_date);
      return days !== null && days > 0 && days <= 30;
    }).length;
  }

  /** Everything the admin should act on: expired plus expiring today. */
  attentionDocs(): DocumentRecord[] {
    return this.expiringToday().concat(this.expiredDocs());
  }

  /** The grey line under the "Needs attention" number. */
  attentionHint(): string {
    const parts: string[] = [];
    if (this.expiringToday().length > 0) {
      parts.push(this.expiringToday().length + ' today');
    }
    if (this.expiredDocs().length > 0) {
      parts.push(this.expiredDocs().length + ' expired');
    }
    return parts.length > 0 ? parts.join(' · ') : 'Nothing overdue';
  }

  pinnedCount(): number {
    return this.announcements.filter((item) => item.pinned).length;
  }

  /** The four newest announcements, for the preview list. */
  recent(): Announcement[] {
    return this.announcements.slice(0, 4);
  }

  /** "expires today" / "expired 12 days ago" */
  timing(doc: DocumentRecord): string {
    const days = daysUntil(doc.expiry_date);
    if (days === null) {
      return 'no expiry date';
    }
    if (days === 0) {
      return 'expires today';
    }
    const overdue = Math.abs(days);
    return 'expired ' + overdue + ' day' + (overdue === 1 ? '' : 's') + ' ago';
  }

  /** Keeps the first problem on screen; later ones would just replace it. */
  private reportProblem(error: Error): void {
    if (this.loadError === null) {
      this.loadError = error.message;
    }
  }
}
