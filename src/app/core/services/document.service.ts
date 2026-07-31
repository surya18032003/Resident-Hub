import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { DocumentRecord } from '../models/domain.models';
import { toArray } from '../utils/collection.utils';
import { timeValue } from '../utils/date.utils';
import { ApiService } from './api.service';
import { LocalRecordsService } from './local-records.service';

/** What the create-document form hands to this service. */
export interface CreateDocumentInput {
  document_title: string;
  document_category: string;
  expiry_date: string; // "2026-07-30", straight from the date input
  remarks: string;
  file: File | null;
}

const COLLECTION = 'documents';

/** Everything about documents lives here: upload and list. */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private api = inject(ApiService);
  private local = inject(LocalRecordsService);

  /**
   * POST create_document.
   *
   * A file cannot travel as JSON, so we build a FormData: the same thing a
   * plain HTML <form enctype="multipart/form-data"> would send. Angular sets
   * the Content-Type header automatically when it sees a FormData.
   */
  create(input: CreateDocumentInput): Observable<string> {
    const form = new FormData();
    form.append('document_title', input.document_title);
    form.append('document_category', input.document_category);
    form.append('expiry_date', input.expiry_date);
    form.append('remarks', input.remarks);
    if (input.file) {
      form.append('document_file', input.file, input.file.name);
    }

    return this.api.post('create_document', form).pipe(
      tap(() => this.local.add(COLLECTION, this.buildLocalCopy(input))),
      map((response) => response.message || 'Document created successfully'),
    );
  }

  /** GET list_document, plus the documents this browser is holding. */
  list(): Observable<DocumentRecord[]> {
    return this.api.get('list_document').pipe(
      map((response) => {
        const fromApi: DocumentRecord[] = toArray(response.data).map((doc: DocumentRecord) => {
          // Older records have no document_file at all.
          return { ...doc, document_file: doc.document_file || [] };
        });

        const fromBrowser: DocumentRecord[] = this.local
          .read(COLLECTION)
          .filter((saved: DocumentRecord) => !this.alreadyInList(fromApi, saved));

        const all = fromApi.concat(fromBrowser);
        all.sort((a, b) => timeValue(b.created_time) - timeValue(a.created_time));
        return all;
      }),
    );
  }

  clearLocal(): void {
    this.local.clear(COLLECTION);
  }

  /** Same document if the id matches, or title + category + expiry match. */
  private alreadyInList(list: DocumentRecord[], doc: DocumentRecord): boolean {
    return list.some((item) => {
      if (item._id === doc._id) {
        return true;
      }
      const sameTitle = this.clean(item.document_title) === this.clean(doc.document_title);
      const sameCategory = this.clean(item.document_category) === this.clean(doc.document_category);
      const sameExpiry = timeValue(item.expiry_date) === timeValue(doc.expiry_date);
      return sameTitle && sameCategory && sameExpiry;
    });
  }

  private clean(value: string | undefined): string {
    return (value || '').trim().toLowerCase();
  }

  private buildLocalCopy(input: CreateDocumentInput): DocumentRecord {
    return {
      _id: this.local.newId(),
      document_title: input.document_title,
      document_category: input.document_category,
      // The file is on the server's S3 bucket, but create_document does not
      // reply with its URL, so there is no link to show for this copy.
      document_file: [],
      expiry_date: input.expiry_date,
      remarks: input.remarks,
      created_time: { $date: Date.now() },
      __local: true,
    };
  }
}
