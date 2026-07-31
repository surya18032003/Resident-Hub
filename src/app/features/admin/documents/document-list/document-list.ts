import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DocumentRecord } from '../../../../core/models/domain.models';
import { DocumentService } from '../../../../core/services/document.service';
import { matchesSearch } from '../../../../core/utils/collection.utils';
import { daysUntil } from '../../../../core/utils/date.utils';
import { ApiDatePipe } from '../../../../shared/pipes/api-date.pipe';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SearchBox } from '../../../../shared/components/search-box/search-box';

/** The coloured badge in the "Expiry date" column. */
interface ExpiryStatus {
  label: string;
  className: string;
}

/** The document table. Works the same way as the resident table. */
@Component({
  selector: 'app-document-list',
  imports: [RouterLink, Icon, PageHeader, SearchBox, Pagination, EmptyState, ApiDatePipe],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css',
})
export class DocumentList {
  private documentService = inject(DocumentService);

  documents: DocumentRecord[] = [];
  loading = true;
  loadError: string | null = null;

  search = '';
  page = 1;
  pageSize = 10;

  skeletonRows = [0, 1, 2, 3, 4];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = null;

    this.documentService.list().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
        this.fixPageNumber();
      },
      error: (error: Error) => {
        this.documents = [];
        this.loadError = error.message;
        this.loading = false;
      },
    });
  }

  filtered(): DocumentRecord[] {
    const term = this.search;
    return this.documents.filter((doc) =>
      matchesSearch(term, [doc.document_title, doc.document_category, doc.remarks]),
    );
  }

  paged(): DocumentRecord[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  }

  localCount(): number {
    return this.documents.filter((doc) => doc.__local).length;
  }

  onSearch(term: string): void {
    this.search = term;
    this.page = 1;
  }

  goToPage(page: number): void {
    this.page = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
  }

  clearLocal(): void {
    this.documentService.clearLocal();
    this.load();
  }

  /** The link to the uploaded file, or null when there is none. */
  fileUrl(doc: DocumentRecord): string | null {
    const files = doc.document_file || [];
    return files.length > 0 ? files[0] : null;
  }

  /** Turns the expiry date into a coloured badge. */
  status(doc: DocumentRecord): ExpiryStatus | null {
    const days = daysUntil(doc.expiry_date);
    if (days === null) {
      return null;
    }
    if (days < 0) {
      return { label: 'Expired ' + Math.abs(days) + 'd ago', className: 'badge badge--danger' };
    }
    if (days === 0) {
      return { label: 'Expires today', className: 'badge badge--danger' };
    }
    if (days <= 30) {
      return { label: days + 'd left', className: 'badge badge--warning' };
    }
    return { label: 'Valid', className: 'badge badge--success' };
  }

  private fixPageNumber(): void {
    const lastPage = Math.max(1, Math.ceil(this.filtered().length / this.pageSize));
    if (this.page > lastPage) {
      this.page = lastPage;
    }
  }
}
