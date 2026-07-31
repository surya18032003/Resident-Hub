import { Component, Input } from '@angular/core';

import { Icon, IconName } from '../icon/icon';

/**
 * The centred "nothing here" block: used for empty lists, searches that found
 * nothing, and failed requests (pass tone="error" for the red version).
 */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  @Input() icon: IconName = 'inbox';
  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() tone: 'neutral' | 'error' = 'neutral';
}
