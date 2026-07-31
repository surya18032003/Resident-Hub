import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Announcement } from '../../../../core/models/domain.models';
import { AnnouncementService } from '../../../../core/services/announcement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { matchesSearch } from '../../../../core/utils/collection.utils';
import { AnnouncementCard } from '../../../../shared/components/announcement-card/announcement-card';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchBox } from '../../../../shared/components/search-box/search-box';

/**
 * The resident's announcement feed.
 *
 * One component serves two routes:
 *   /resident/announcements/all      -> every announcement
 *   /resident/announcements/pinned   -> only the pinned ones
 *
 * The ":filter" part of the route tells us which, and we read it from
 * ActivatedRoute below.
 */
@Component({
  selector: 'app-announcement-feed',
  imports: [PageHeader, SearchBox, EmptyState, AnnouncementCard],
  templateUrl: './announcement-feed.html',
  styleUrl: './announcement-feed.css',
})
export class AnnouncementFeed implements OnDestroy {
  private announcementService = inject(AnnouncementService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  announcements: Announcement[] = [];
  loading = true;
  loadError: string | null = null;
  search = '';

  /** 'all' or 'pinned'. */
  mode = 'all';

  /** Ids whose pin request has been sent but not answered yet. */
  pinningIds: string[] = [];

  skeletons = [0, 1, 2];

  private routeSubscription: Subscription;

  constructor() {
    // paramMap fires again when the user switches all <-> pinned, because
    // Angular reuses this component instead of building a new one.
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const filter = params.get('filter');
      this.mode = filter === 'pinned' ? 'pinned' : 'all';
    });

    this.load();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
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

  /** The posts to draw: the current filter, then the search box. */
  visible(): Announcement[] {
    const term = this.search;
    const pinnedOnly = this.mode === 'pinned';

    return this.announcements.filter((item) => {
      if (pinnedOnly && !item.pinned) {
        return false;
      }
      return matchesSearch(term, [item.title, item.summary, item.category]);
    });
  }

  pinnedCount(): number {
    return this.announcements.filter((item) => item.pinned).length;
  }

  isPinning(id: string): boolean {
    return this.pinningIds.includes(id);
  }

  /** Switches between the two routes when a filter chip is clicked. */
  show(mode: string): void {
    this.router.navigate(['/resident/announcements', mode]);
  }

  /**
   * Pin or unpin.
   *
   * The card flips straight away instead of waiting for the server, which
   * feels instant. If the request then fails we flip it back and say so.
   */
  togglePin(announcement: Announcement): void {
    const id = announcement._id;
    if (this.isPinning(id)) {
      return; // already waiting for an answer for this card
    }

    const wasPinned = announcement.pinned === true;
    this.setPinned(id, !wasPinned);
    this.pinningIds.push(id);

    this.announcementService.togglePin(id).subscribe({
      next: (message) => {
        this.stopPinning(id);
        this.toast.success(message, announcement.title);
      },
      error: (error: Error) => {
        this.setPinned(id, wasPinned); // put it back the way it was
        this.stopPinning(id);
        this.toast.error('Could not update the pin', error.message);
      },
    });
  }

  /** Flips the pinned flag on one announcement in the list. */
  private setPinned(id: string, pinned: boolean): void {
    const found = this.announcements.find((item) => item._id === id);
    if (found) {
      found.pinned = pinned;
    }
  }

  private stopPinning(id: string): void {
    this.pinningIds = this.pinningIds.filter((item) => item !== id);
  }
}
