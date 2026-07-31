import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Announcement } from '../models/domain.models';
import { toArray } from '../utils/collection.utils';
import { timeValue } from '../utils/date.utils';
import { ApiService } from './api.service';

/** What the create-announcement form hands to this service. */
export interface CreateAnnouncementInput {
  category: string;
  title: string;
  summary: string;
  event_date: string; // "2026-07-30"
  image: File | null; // optional
}

/** Everything about announcements: create, list, and pin/unpin. */
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private api = inject(ApiService);

  /** POST create_announcement (FormData, because it can carry an image). */
  create(input: CreateAnnouncementInput): Observable<string> {
    const form = new FormData();
    form.append('category', input.category);
    form.append('title', input.title);
    form.append('summary', input.summary);
    form.append('event_date', input.event_date);
    if (input.image) {
      form.append('images', input.image, input.image.name);
    }

    return this.api
      .post('create_announcement', form)
      .pipe(map((response) => response.message || 'Announcement created successfully'));
  }

  /** GET list_announcement. This endpoint does return everything. */
  list(): Observable<Announcement[]> {
    return this.api.get('list_announcement').pipe(
      map((response) => {
        const items: Announcement[] = toArray(response.data).map((item: Announcement) => {
          // Fill in the fields older records are missing.
          return {
            ...item,
            images: item.images || [],
            pinned: item.pinned || false,
          };
        });

        items.sort((a, b) => timeValue(b.created_time) - timeValue(a.created_time));
        return items;
      }),
    );
  }

  /**
   * POST pin_unpin_announcement.
   * The endpoint is a switch: pinned becomes unpinned and the other way round.
   */
  togglePin(announcementId: string): Observable<string> {
    return this.api
      .post('pin_unpin_announcement', { announcement_id: announcementId })
      .pipe(map((response) => response.message || 'Announcement updated'));
  }
}
