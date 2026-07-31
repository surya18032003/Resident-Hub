import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Resident } from '../../../../core/models/domain.models';
import { ResidentService } from '../../../../core/services/resident.service';
import { matchesSearch } from '../../../../core/utils/collection.utils';
import { ApiDatePipe } from '../../../../shared/pipes/api-date.pipe';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SearchBox } from '../../../../shared/components/search-box/search-box';

/**
 * The resident table: search, pagination and the create button.
 *
 * The API has no search or paging, so it hands us every resident at once and
 * we do both here in the browser:
 *   residents  -> everything we loaded
 *   filtered() -> what matches the search box
 *   paged()    -> the slice shown on the current page
 */
@Component({
  selector: 'app-resident-list',
  imports: [RouterLink, Icon, PageHeader, SearchBox, Pagination, EmptyState, ApiDatePipe],
  templateUrl: './resident-list.html',
  styleUrl: './resident-list.css',
})
export class ResidentList {
  private residentService = inject(ResidentService);

  residents: Resident[] = [];
  loading = true;
  loadError: string | null = null;

  search = '';
  page = 1;
  pageSize = 10;

  /** Just something to repeat while drawing the grey loading rows. */
  skeletonRows = [0, 1, 2, 3, 4];

  constructor() {
    this.load();
  }

  /** Asks the server for the residents. Called on open and by Refresh. */
  load(): void {
    this.loading = true;
    this.loadError = null;

    this.residentService.list().subscribe({
      next: (residents) => {
        this.residents = residents;
        this.loading = false;
        this.fixPageNumber();
      },
      error: (error: Error) => {
        this.residents = [];
        this.loadError = error.message;
        this.loading = false;
      },
    });
  }

  /** The residents matching the search box. */
  filtered(): Resident[] {
    const term = this.search;
    return this.residents.filter((resident) =>
      matchesSearch(term, [
        resident.name,
        resident.last_name,
        resident.email,
        resident.mobile,
        resident.property_no,
        resident.user_type,
      ]),
    );
  }

  /** Only the rows belonging to the page we are on. */
  paged(): Resident[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  }

  /** How many rows are shown from this browser rather than from the API. */
  localCount(): number {
    return this.residents.filter((resident) => resident.__local).length;
  }

  onSearch(term: string): void {
    this.search = term;
    this.page = 1; // a new search always starts on page 1
  }

  goToPage(page: number): void {
    this.page = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
  }

  /** Forget the residents kept in this browser (see resident.service.ts). */
  clearLocal(): void {
    this.residentService.clearLocal();
    this.load();
  }

  /** "Priya" + "Sharma" -> "Priya Sharma" */
  fullName(resident: Resident): string {
    const parts = [resident.name, resident.last_name].filter((part) => !!part);
    return parts.join(' ').trim() || '—';
  }

  /** Picks the colour of the Owner / Tenant badge. */
  typeClass(type: string | undefined): string {
    const value = (type || '').toLowerCase();
    if (value === 'owner') {
      return 'badge badge--owner';
    }
    if (value === 'tenant') {
      return 'badge badge--tenant';
    }
    return 'badge';
  }

  /** After a reload, page 5 of a 2-page list would show nothing. */
  private fixPageNumber(): void {
    const lastPage = Math.max(1, Math.ceil(this.filtered().length / this.pageSize));
    if (this.page > lastPage) {
      this.page = lastPage;
    }
  }
}
