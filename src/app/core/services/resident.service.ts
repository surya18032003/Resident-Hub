import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { CreateResidentRequest, Resident } from '../models/domain.models';
import { toArray } from '../utils/collection.utils';
import { timeValue } from '../utils/date.utils';
import { ApiService } from './api.service';
import { LocalRecordsService } from './local-records.service';

/** Name of the localStorage bucket used by LocalRecordsService. */
const COLLECTION = 'residents';

/** Everything about residents lives here: create and list. */
@Injectable({ providedIn: 'root' })
export class ResidentService {
  private api = inject(ApiService);
  private local = inject(LocalRecordsService);

  /** POST create_user. Returns the success message from the server. */
  create(payload: CreateResidentRequest): Observable<string> {
    return this.api.post('create_user', payload).pipe(
      // Runs only when the server said yes. See local-records.service.ts.
      tap(() => this.local.add(COLLECTION, this.buildLocalCopy(payload))),
      map((response) => response.message || 'Resident created successfully'),
    );
  }

  /** GET list_user, plus the residents this browser is holding. */
  list(): Observable<Resident[]> {
    return this.api.get('list_user').pipe(
      map((response) => {
        const fromApi: Resident[] = toArray(response.data);

        // Skip any local copy the API has started returning by itself.
        const fromBrowser: Resident[] = this.local
          .read(COLLECTION)
          .filter((saved: Resident) => !this.alreadyInList(fromApi, saved));

        const all = fromApi.concat(fromBrowser);
        // Newest first.
        all.sort((a, b) => timeValue(b.created_time) - timeValue(a.created_time));
        return all;
      }),
    );
  }

  clearLocal(): void {
    this.local.clear(COLLECTION);
  }

  /** Same person if the id matches, or the email matches. */
  private alreadyInList(list: Resident[], resident: Resident): boolean {
    return list.some((item) => {
      if (item._id === resident._id) {
        return true;
      }
      const a = (item.email || '').toLowerCase();
      const b = (resident.email || '').toLowerCase();
      return a !== '' && a === b;
    });
  }

  private buildLocalCopy(payload: CreateResidentRequest): Resident {
    return {
      _id: this.local.newId(),
      name: payload.name,
      last_name: payload.last_name,
      email: payload.email,
      mobile: payload.mobile,
      property_no: payload.property_no,
      user_type: payload.user_type,
      created_time: { $date: Date.now() },
      __local: true, // shows the small "New" badge in the table
    };
  }
}
