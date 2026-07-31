/**
 * Every endpoint on this backend replies with the same wrapper, for example:
 *
 * {
 *   "data":    { ... }  or  [ ... ],   <- the useful part
 *   "message": "User created successfully",
 *   "success": true,
 *   "error":   null
 * }
 *
 * `data` is typed as `any` on purpose: its shape changes per endpoint, and each
 * service says what it really is (see resident.service.ts and friends).
 */
export interface ApiResponse {
  data: any;
  message: string;
  success: boolean;
  error: string | null;
  add_on_info?: any;
}

/**
 * Dates do not arrive as plain text. Mongo sends them as an object holding the
 * number of milliseconds since 1 Jan 1970, e.g. { "$date": 1783382400000 }.
 */
export interface MongoDate {
  $date: number;
}

/** A date field can be any of these shapes, or missing entirely. */
export type ApiDate = MongoDate | string | number | null | undefined;

/** The three values we read out of the login token. */
export interface JwtPayload {
  user_id: string;
  user_type: string;
  exp: number;
}
