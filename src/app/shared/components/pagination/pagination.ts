import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * The "Showing 1-10 of 42" bar with the page buttons.
 *
 * It does not slice the data itself — the parent does that. This component
 * only draws the controls and reports which page was clicked.
 */
@Component({
  selector: 'app-pagination',
  imports: [Icon],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input({ required: true }) total = 0;
  @Input({ required: true }) page = 1;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageSizeOptions = [5, 10, 25, 50];

  totalPages(): number {
    const pages = Math.ceil(this.total / this.pageSize);
    return pages < 1 ? 1 : pages;
  }

  /** The "1" in "Showing 1-10 of 42". */
  firstItem(): number {
    if (this.total === 0) {
      return 0;
    }
    return (this.page - 1) * this.pageSize + 1;
  }

  /** The "10" in "Showing 1-10 of 42". */
  lastItem(): number {
    const last = this.page * this.pageSize;
    return last > this.total ? this.total : last;
  }

  /**
   * Which page numbers to draw. With many pages we show the first, the last,
   * and the ones around the current page: 1 … 6 7 8 … 25
   * A -1 in the list means "draw the … gap here".
   */
  pageNumbers(): number[] {
    const total = this.totalPages();

    if (total <= 7) {
      const all: number[] = [];
      for (let page = 1; page <= total; page++) {
        all.push(page);
      }
      return all;
    }

    const wanted = [1, 2, total - 1, total, this.page - 1, this.page, this.page + 1];
    const kept: number[] = [];

    for (const page of wanted) {
      if (page >= 1 && page <= total && !kept.includes(page)) {
        kept.push(page);
      }
    }
    kept.sort((a, b) => a - b);

    // Insert the gap markers.
    const withGaps: number[] = [];
    for (let i = 0; i < kept.length; i++) {
      if (i > 0 && kept[i] - kept[i - 1] > 1) {
        withGaps.push(-1);
      }
      withGaps.push(kept[i]);
    }
    return withGaps;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSizeChange.emit(Number(select.value));
  }
}
