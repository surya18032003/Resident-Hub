import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';

import { ApiDate } from '../../core/models/api.models';
import { parseApiDate, relativeTime } from '../../core/utils/date.utils';

/**
 * A pipe is a small converter you use inside a template with the | character.
 *
 *   {{ doc.expiry_date | apiDate }}                 -> 07 Jul 2026
 *   {{ doc.created_time | apiDate: 'dd MMM' : true }}
 *
 * This one understands the API's { "$date": ... } format, which Angular's
 * built-in `date` pipe does not.
 *
 * The third argument (`local`) matters: day-only fields such as expiry_date
 * are stored at midnight UTC and must be read that way, while created_time is
 * a real moment in time and should be shown in the user's own time zone.
 */
@Pipe({ name: 'apiDate' })
export class ApiDatePipe implements PipeTransform {
  private datePipe = inject(DatePipe);

  transform(value: ApiDate, format = 'dd MMM yyyy', local = false): string {
    const date = parseApiDate(value);
    if (!date) {
      return '—'; // nothing to show
    }
    const timeZone = local ? undefined : 'UTC';
    return this.datePipe.transform(date, format, timeZone) || '—';
  }
}

/** {{ post.created_time | timeAgo }} -> "3 days ago" */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: ApiDate): string {
    return relativeTime(value);
  }
}
