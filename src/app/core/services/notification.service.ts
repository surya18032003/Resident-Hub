import { Injectable, inject } from '@angular/core';

import { DocumentRecord } from '../models/domain.models';
import { daysUntil } from '../utils/date.utils';
import { DocumentService } from './document.service';

/** A document counts as "expiring soon" this many days ahead. */
const SOON_DAYS = 30;

/** Where the "already seen" notification ids are remembered. */
const SEEN_KEY = 'res-hub.seen-notifications';

/**
 * The notification screen.
 *
 * There is no notification endpoint on the server, so we build the list from
 * the documents: anything whose expiry date has passed, is today, or is close.
 *
 * The red badge counts only notifications you have not opened yet. Visiting the
 * Notifications page marks the current ones as seen, so the badge clears — but
 * the page itself keeps showing every document, because an expired document is
 * still expired after you have looked at it.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private documentService = inject(DocumentService);

  /** All documents, refreshed from the server. */
  private documents: DocumentRecord[] = [];

  /** Ids of notifications the user has already opened. */
  private seenIds: string[] = this.readSeenIds();

  loading = false;
  loaded = false;

  soonDays = SOON_DAYS;

  /** Expiry date is today. This is the case the assessment asks for. */
  expiringToday(): DocumentRecord[] {
    return this.documents.filter((doc) => daysUntil(doc.expiry_date) === 0);
  }

  /** Expiry date has already passed, most recent first. */
  expired(): DocumentRecord[] {
    const list = this.documents.filter((doc) => {
      const days = daysUntil(doc.expiry_date);
      return days !== null && days < 0;
    });
    list.sort((a, b) => (daysUntil(b.expiry_date) || 0) - (daysUntil(a.expiry_date) || 0));
    return list;
  }

  /** Due within the next 30 days, soonest first. */
  expiringSoon(): DocumentRecord[] {
    const list = this.documents.filter((doc) => {
      const days = daysUntil(doc.expiry_date);
      return days !== null && days > 0 && days <= SOON_DAYS;
    });
    list.sort((a, b) => (daysUntil(a.expiry_date) || 0) - (daysUntil(b.expiry_date) || 0));
    return list;
  }

  /** Everything shown on the notification page. */
  all(): DocumentRecord[] {
    return this.expiringToday().concat(this.expired(), this.expiringSoon());
  }

  /** Expired + expiring today: the ones that need action now. */
  needsAction(): DocumentRecord[] {
    return this.expiringToday().concat(this.expired());
  }

  /** The number in the red badge — only the ones not opened yet. */
  unreadCount(): number {
    return this.needsAction().filter((doc) => !this.seenIds.includes(doc._id)).length;
  }

  /** Loads the documents. Call `refresh(true)` when opening the page itself. */
  refresh(markAsSeen = false): void {
    this.loading = true;

    this.documentService.list().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
        this.loaded = true;
        if (markAsSeen) {
          this.markAllSeen();
        }
      },
      error: () => {
        // The list screens show the error; the badge simply stays as it was.
        this.loading = false;
        this.loaded = true;
      },
    });
  }

  /** Remembers today's notifications as read, which empties the badge. */
  markAllSeen(): void {
    this.seenIds = this.needsAction().map((doc) => doc._id);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(this.seenIds));
    } catch {
      // Not being able to remember is harmless: the badge just stays visible.
    }
  }

  private readSeenIds(): string[] {
    try {
      const text = localStorage.getItem(SEEN_KEY);
      const value = text ? JSON.parse(text) : [];
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
}
