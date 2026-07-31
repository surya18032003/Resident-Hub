import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../icon/icon';

/** One of the number tiles at the top of a dashboard. */
@Component({
  selector: 'app-stat-card',
  imports: [Icon, RouterLink],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input({ required: true }) icon: IconName = 'dashboard';

  /** Small grey line under the number. */
  @Input() hint = '';

  /** Changes the colour of the icon and the top edge. */
  @Input() tone: 'brand' | 'success' | 'warning' | 'info' = 'brand';

  /** When set, the whole tile becomes a link to this route. */
  @Input() link: string | null = null;

  /** Shows a grey placeholder instead of the number while data loads. */
  @Input() loading = false;
}
