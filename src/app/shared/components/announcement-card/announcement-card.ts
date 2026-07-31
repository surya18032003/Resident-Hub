import { TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Announcement } from '../../../core/models/domain.models';
import { ApiDatePipe, TimeAgoPipe } from '../../pipes/api-date.pipe';
import { Icon } from '../icon/icon';

/**
 * One post in the announcement feed (the LinkedIn-style card).
 *
 * The admin sees it read-only; residents get the Pin button, which is switched
 * on with [canPin]="true".
 */
@Component({
  selector: 'app-announcement-card',
  imports: [Icon, ApiDatePipe, TimeAgoPipe, TitleCasePipe],
  templateUrl: './announcement-card.html',
  styleUrl: './announcement-card.css',
})
export class AnnouncementCard {
  @Input({ required: true }) announcement!: Announcement;
  @Input() canPin = false;

  /** true while this card's pin request is still running. */
  @Input() pinning = false;

  @Output() pinToggle = new EventEmitter<Announcement>();

  /** Some uploaded image links are broken; we hide the image if it fails. */
  imageFailed = false;

  /** The image to show, or null for a text-only card. */
  imageUrl(): string | null {
    if (this.imageFailed) {
      return null;
    }
    const images = this.announcement.images || [];
    return images.length > 0 ? images[0] : null;
  }

  category(): string {
    return this.announcement.category || 'announcement';
  }

  /** First letter of the title, shown in the round coloured avatar. */
  initial(): string {
    const title = this.announcement.title || '?';
    return title.charAt(0).toUpperCase();
  }

  onImageError(): void {
    this.imageFailed = true;
  }

  onPinClick(): void {
    // The parent decides what pinning means; this card just reports the click.
    this.pinToggle.emit(this.announcement);
  }
}
