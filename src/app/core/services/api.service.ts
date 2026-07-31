import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';

/**
 * The one place that talks to the server.
 *
 * Everything else in the app calls `api.get(...)` / `api.post(...)` instead of
 * using HttpClient directly, so the server address is written down only once.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  // `inject()` hands us a ready-made HttpClient. It is the modern way of
  // writing `constructor(private http: HttpClient) {}`.
  private http = inject(HttpClient);

  /** Example: get('list_user') calls https://.../api/v1/test/list_user */
  get(path: string): Observable<ApiResponse> {
    return this.http
      .get<ApiResponse>(this.fullUrl(path))
      .pipe(map((res) => this.checkSuccess(res)));
  }

  /** `body` is either a plain object (JSON) or a FormData (file upload). */
  post(path: string, body: unknown): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(this.fullUrl(path), body)
      .pipe(map((res) => this.checkSuccess(res)));
  }

  private fullUrl(path: string): string {
    return environment.apiBaseUrl + '/' + path;
  }

  /**
   * This API sometimes reports a failure while still replying "200 OK", with
   * `success: false` inside the body. Throwing here means the component's
   * `error:` handler runs, exactly as it would for a real network error.
   */
  private checkSuccess(response: ApiResponse): ApiResponse {
    if (response && response.success === false) {
      throw new Error(response.message || 'The request could not be completed.');
    }
    return response;
  }
}
