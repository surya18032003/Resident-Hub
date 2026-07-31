import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Turns any failed request into one readable sentence.
 *
 * Components then only ever deal with `error.message`, instead of digging
 * through status codes and response bodies themselves.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = buildMessage(error);

      // 401 means the server rejected our token: the session is over.
      if (error.status === 401 && !request.url.endsWith('/login') && auth.isLoggedIn()) {
        toast.error('Session expired', 'Please sign in again to continue.');
        auth.logout();
      }

      // Hand a normal Error to whoever subscribed to the request.
      return throwError(() => new Error(message));
    }),
  );
};

function buildMessage(error: HttpErrorResponse): string {
  // This API puts the reason in `message`, even when it fails.
  const body = error.error;
  if (typeof body === 'string' && body.trim() !== '') {
    return body;
  }
  if (body && typeof body === 'object' && body.message) {
    return body.message;
  }

  // No usable body, so fall back on the status code.
  if (error.status === 0) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  if (error.status === 413) {
    return 'The uploaded file is too large.';
  }
  if (error.status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.';
  }
  return 'Something went wrong. Please try again.';
}
