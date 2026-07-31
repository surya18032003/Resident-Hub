import { ApiDate } from '../models/api.models';

/**
 * Date helpers.
 *
 * Two things to know about the dates this API sends:
 *
 * 1. They usually look like { "$date": 1783382400000 } — milliseconds since
 *    1 Jan 1970 — rather than "2026-07-07".
 * 2. Day-only fields (event_date, expiry_date) are stored at midnight UTC. If
 *    you read them with the normal getDate(), a browser west of London shows
 *    the day before. So we read those with the getUTC... versions.
 */

/** Turns whatever the API sent into a real Date object (or null). */
export function parseApiDate(value: ApiDate): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // The { $date: ... } shape.
  if (typeof value === 'object' && typeof (value as any).$date === 'number') {
    return new Date((value as any).$date);
  }

  // A plain string like "2026-07-30", or a number of milliseconds.
  const date = new Date(value as string | number);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * How many whole days from today until this date.
 *   -3 -> expired three days ago
 *    0 -> today
 *    5 -> five days from now
 * Returns null when there is no usable date.
 */
export function daysUntil(value: ApiDate): number | null {
  const date = parseApiDate(value);
  if (!date) {
    return null;
  }

  const now = new Date();
  // Compare whole days only, so the time of day cannot shift the answer.
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((target - today) / oneDay);
}

/** Milliseconds since 1970 — handy for sorting newest first. */
export function timeValue(value: ApiDate): number {
  const date = parseApiDate(value);
  return date ? date.getTime() : 0;
}

/** "just now", "5 minutes ago", "3 days ago" — used on the feed cards. */
export function relativeTime(value: ApiDate): string {
  const date = parseApiDate(value);
  if (!date) {
    return '';
  }

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return plural(minutes, 'minute');
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return plural(hours, 'hour');
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return plural(days, 'day');
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return plural(months, 'month');
  }

  return plural(Math.floor(months / 12), 'year');
}

function plural(count: number, unit: string): string {
  const suffix = count === 1 ? '' : 's';
  return count + ' ' + unit + suffix + ' ago';
}
