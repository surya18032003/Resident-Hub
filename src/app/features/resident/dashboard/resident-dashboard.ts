import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Announcement } from '../../../core/models/domain.models';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { AuthService } from '../../../core/services/auth.service';
import { daysUntil } from '../../../core/utils/date.utils';
import { AnnouncementCard } from '../../../shared/components/announcement-card/announcement-card';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';

/** The resident's home page: three counters and the newest posts. */
@Component({
  selector: 'app-resident-dashboard',
  imports: [RouterLink, Icon, PageHeader, StatCard, EmptyState, AnnouncementCard],
  templateUrl: './resident-dashboard.html',
  styleUrl: './resident-dashboard.css',
})
export class ResidentDashboard {
  private announcementService = inject(AnnouncementService);
  private auth = inject(AuthService);

  announcements: Announcement[] = [];
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

    this.announcementService.list().subscribe({
      next: (announcements) => {
        this.announcements = announcements;
        this.loading = false;
      },
      error: (error: Error) => {
        this.announcements = [];
        this.loadError = error.message;
        this.loading = false;
      },
    });
  }

  pinnedCount(): number {
    return this.announcements.filter((item) => item.pinned).length;
  }

  /** Events happening today or later. */
  upcomingCount(): number {
    return this.announcements.filter((item) => {
      const days = daysUntil(item.event_date);
      return days !== null && days >= 0;
    }).length;
  }

  /** Three posts for the preview: pinned ones first, then the newest. */
  latest(): Announcement[] {
    const copy = [...this.announcements];
    copy.sort((a, b) => Number(b.pinned === true) - Number(a.pinned === true));
    return copy.slice(0, 3);
  }
}
