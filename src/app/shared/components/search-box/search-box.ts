import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * The search field used by the list screens.
 *
 *   <app-search-box placeholder="Search…" (valueChange)="onSearch($event)" />
 *
 * `@Output()` is how a child talks back to its parent: the parent listens with
 * (valueChange), and this component fires it with `.emit(...)`.
 *
 * It waits a moment before reporting what you typed ("debouncing"), so the
 * list is not re-filtered on every single keystroke.
 */
@Component({
  selector: 'app-search-box',
  imports: [Icon],
  templateUrl: './search-box.html',
  styleUrl: './search-box.css',
})
export class SearchBox {
  @Input() placeholder = 'Search…';
  @Output() valueChange = new EventEmitter<string>();

  /** Drives the little clear (x) button. */
  hasValue = false;

  private timer: any = null;

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.hasValue = input.value.length > 0;
    this.report(input.value);
  }

  clear(input: HTMLInputElement): void {
    input.value = '';
    this.hasValue = false;
    this.report('');
    input.focus();
  }

  /** Cancels the previous countdown and starts a new 250ms one. */
  private report(value: string): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.valueChange.emit(value), 250);
  }
}
