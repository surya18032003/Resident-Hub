/**
 * Makes sure we always work with an array.
 *
 * Why this exists: `list_announcement` sends an array, but `list_user` and
 * `list_document` send a single object, and "nothing found" arrives as `{}`.
 * Running every list response through here means the screens only ever deal
 * with an array.
 */
export function toArray(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data === null || data === undefined) {
    return [];
  }
  // An empty object `{}` means "no record", not "one empty record".
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    return [];
  }
  return [data];
}

/**
 * True when the search term appears in any of the given fields.
 * Used by the search boxes on the list screens.
 */
export function matchesSearch(term: string, fields: any[]): boolean {
  const needle = term.trim().toLowerCase();
  if (needle === '') {
    return true; // an empty search matches everything
  }

  for (const field of fields) {
    if (field === null || field === undefined) {
      continue;
    }
    if (String(field).toLowerCase().includes(needle)) {
      return true;
    }
  }
  return false;
}
