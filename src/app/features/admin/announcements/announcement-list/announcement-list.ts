import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Announcement } from '../../../../core/models/domain.models';
import { AnnouncementService } from '../../../../core/services/announcement.service';
import { matchesSearch } from '../../../../core/utils/collection.utils';
import { AnnouncementCard } from '../../../../shared/components/announcement-card/announcement-card';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchBox } from '../../../../shared/components/search-box/search-box';

/** The admin's read-only view of the announcement feed. */
@Component({
  selector: 'app-announcement-list',
  imports: [RouterLink, Icon, PageHeader, SearchBox, EmptyState, AnnouncementCard],
  templateUrl: './announcement-list.html',
  styleUrl: './announcement-list.css',
})
export class AnnouncementList {
  private announcementService = inject(AnnouncementService);

  announcements: Announcement[] = [];
  loading = true;
  loadError: string | null = null;

  search = '';
  category = 'all';

  /** The filter buttons above the feed. */
  filters = [
    { value: 'all', label: 'All' },
    { value: 'announcement', label: 'Announcements' },
    { value: 'event', label: 'Events' },
    { value: 'updates', label: 'Updates' },
  ];

  skeletons = [0, 1, 2];

  constructor() {
    this.load();
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

  onSearch(term: string): void {
    this.search = term;
  }

  setCategory(value: string): void {
    this.category = value;
  }

  /** What the search box and the category buttons leave behind. */
  filtered(): Announcement[] {
    const term = this.search;
    const category = this.category;

    return this.announcements.filter((item) => {
      const categoryMatches = category === 'all' || this.categoryOf(item) === category;
      const searchMatches = matchesSearch(term, [item.title, item.summary, item.category]);
      return categoryMatches && searchMatches;
    });
  }

  pinnedCount(): number {
    return this.announcements.filter((item) => item.pinned).length;
  }

  /** The little number inside each filter button. */
  countFor(value: string): number {
    if (value === 'all') {
      return this.announcements.length;
    }
    return this.announcements.filter((item) => this.categoryOf(item) === value).length;
  }

  private categoryOf(item: Announcement): string {
    return (item.category || '').toLowerCase();
  }
}
