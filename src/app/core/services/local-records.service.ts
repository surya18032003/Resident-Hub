import { Injectable } from '@angular/core';

/**
 * Remembers records that the API saves but refuses to list back.
 *
 * The problem: POST create_user answers "User created successfully", but
 * GET list_user always returns the same single record, so a new resident would
 * disappear from the screen. Same story for documents.
 *
 * The fix: after a successful create we also keep a copy here, in the
 * browser's localStorage, and the list screens show API records + these copies.
 * If the API ever starts returning them, the services drop the duplicate.
 */
@Injectable({ providedIn: 'root' })
export class LocalRecordsService {
  /** collection is 'residents' or 'documents'. */
  read(collection: string): any[] {
    try {
      const text = localStorage.getItem(this.storageKey(collection));
      if (!text) {
        return [];
      }
      const value = JSON.parse(text);
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  add(collection: string, record: any): void {
    const records = this.read(collection);
    records.unshift(record); // newest first
    try {
      localStorage.setItem(this.storageKey(collection), JSON.stringify(records));
    } catch {
      // Storage can be full or blocked (private mode). The record is still on
      // the server, so there is nothing to recover from here.
    }
  }

  clear(collection: string): void {
    localStorage.removeItem(this.storageKey(collection));
  }

  /** An id for a record the server never gave us one for. */
  newId(): string {
    return 'local-' + Date.now() + '-' + Math.round(Math.random() * 100000);
  }

  private storageKey(collection: string): string {
    return 'res-hub.local.' + collection;
  }
}
